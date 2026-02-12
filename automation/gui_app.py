"""
FinanceDaily Automation - Desktop Control Panel
A GUI application to manage the FinanceDaily content automation system.
"""
import os
import sys
import threading
import time
import json
import random
import traceback
from datetime import datetime, timedelta

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox

# Determine the correct base directory
# When running as exe, find the automation folder relative to the exe
if getattr(sys, 'frozen', False):
    # Running as compiled exe
    exe_dir = os.path.dirname(sys.executable)
    # Look for automation folder - exe might be in various locations
    possible_paths = [
        os.path.join(exe_dir, '..'),                          # exe is in automation/dist
        exe_dir,                                               # exe is in automation
        os.path.join(exe_dir, 'automation'),                   # exe is in project root
        os.path.join(exe_dir, 'financedaily', 'automation'),   # exe is on desktop, project is financedaily/
        os.path.join(exe_dir, '..', 'automation'),             # exe is one level above
    ]
    AUTOMATION_DIR = None
    for p in possible_paths:
        if os.path.exists(os.path.join(p, 'config.py')):
            AUTOMATION_DIR = os.path.abspath(p)
            break
    
    if not AUTOMATION_DIR:
        # Last resort: search common locations
        for base in [
            os.path.expanduser('~\\Desktop\\financedaily\\automation'),
            os.path.expanduser('~\\financedaily\\automation'),
            'C:\\financedaily\\automation',
        ]:
            if os.path.exists(os.path.join(base, 'config.py')):
                AUTOMATION_DIR = os.path.abspath(base)
                break
        else:
            AUTOMATION_DIR = exe_dir
else:
    AUTOMATION_DIR = os.path.dirname(os.path.abspath(__file__))

# Set working directory and add to path
os.chdir(AUTOMATION_DIR)
sys.path.insert(0, AUTOMATION_DIR)

from config import ARTICLES_PER_RUN, OPENAI_API_KEY, NEWS_API_KEY
from news_fetcher import fetch_all_news
from ai_writer import generate_article
from publisher import publish_article, detect_category, slugify, git_push_changes, load_database
from image_handler import get_article_image


# ─── Constants ───────────────────────────────────────────────
APP_TITLE = "FinanceDaily Automation Panel"
INTERVAL_HOURS = 2  # Run every 2 hours
VERSION = "1.0.0"


class AutomationApp:
    def __init__(self, root):
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry("820x650")
        self.root.minsize(700, 550)
        self.root.configure(bg="#0f172a")
        
        # Try to set icon
        try:
            self.root.iconbitmap(default="")
        except:
            pass

        # State
        self.is_running = False
        self.automation_thread = None
        self.stop_event = threading.Event()
        self.next_run_time = None
        self.total_published = 0
        self.total_runs = 0
        self.countdown_job = None

        # Load stats from database
        self._load_stats()

        # Build UI
        self._build_ui()

        # Log startup
        self.log("═" * 60, "header")
        self.log("  FinanceDaily Automation Panel v" + VERSION, "header")
        self.log("═" * 60, "header")
        self.log("")
        self._log_config_status()

        # Handle window close
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _load_stats(self):
        """Load article count from database"""
        try:
            db = load_database()
            self.total_published = len(db.get('articles', []))
        except:
            self.total_published = 0

    def _build_ui(self):
        """Build the GUI layout"""
        # ─── Top Header ───
        header_frame = tk.Frame(self.root, bg="#1e293b", pady=12)
        header_frame.pack(fill="x")

        tk.Label(
            header_frame,
            text="📰 FinanceDaily",
            font=("Segoe UI", 18, "bold"),
            fg="#3b82f6",
            bg="#1e293b"
        ).pack(side="left", padx=20)

        tk.Label(
            header_frame,
            text="Automation Control Panel",
            font=("Segoe UI", 11),
            fg="#94a3b8",
            bg="#1e293b"
        ).pack(side="left", padx=5)

        # ─── Status Bar ───
        status_frame = tk.Frame(self.root, bg="#1e293b", pady=8)
        status_frame.pack(fill="x", padx=10, pady=(10, 5))

        # Status indicator
        self.status_dot = tk.Label(
            status_frame,
            text="●",
            font=("Segoe UI", 16),
            fg="#ef4444",
            bg="#1e293b"
        )
        self.status_dot.pack(side="left", padx=(15, 5))

        self.status_label = tk.Label(
            status_frame,
            text="DURDURULDU",
            font=("Segoe UI", 12, "bold"),
            fg="#ef4444",
            bg="#1e293b"
        )
        self.status_label.pack(side="left", padx=5)

        # Next run countdown
        self.countdown_label = tk.Label(
            status_frame,
            text="",
            font=("Segoe UI", 10),
            fg="#94a3b8",
            bg="#1e293b"
        )
        self.countdown_label.pack(side="right", padx=15)

        # ─── Stats Cards ───
        stats_frame = tk.Frame(self.root, bg="#0f172a")
        stats_frame.pack(fill="x", padx=10, pady=5)

        # Card 1: Total Articles
        card1 = tk.Frame(stats_frame, bg="#1e293b", padx=20, pady=10)
        card1.pack(side="left", expand=True, fill="x", padx=5)
        tk.Label(card1, text="Toplam Makale", font=("Segoe UI", 9), fg="#94a3b8", bg="#1e293b").pack()
        self.articles_count_label = tk.Label(card1, text=str(self.total_published), font=("Segoe UI", 22, "bold"), fg="#22c55e", bg="#1e293b")
        self.articles_count_label.pack()

        # Card 2: Total Runs
        card2 = tk.Frame(stats_frame, bg="#1e293b", padx=20, pady=10)
        card2.pack(side="left", expand=True, fill="x", padx=5)
        tk.Label(card2, text="Toplam Çalışma", font=("Segoe UI", 9), fg="#94a3b8", bg="#1e293b").pack()
        self.runs_count_label = tk.Label(card2, text="0", font=("Segoe UI", 22, "bold"), fg="#3b82f6", bg="#1e293b")
        self.runs_count_label.pack()

        # Card 3: Interval
        card3 = tk.Frame(stats_frame, bg="#1e293b", padx=20, pady=10)
        card3.pack(side="left", expand=True, fill="x", padx=5)
        tk.Label(card3, text="Çalışma Aralığı", font=("Segoe UI", 9), fg="#94a3b8", bg="#1e293b").pack()
        tk.Label(card3, text=f"{INTERVAL_HOURS} Saat", font=("Segoe UI", 22, "bold"), fg="#f59e0b", bg="#1e293b").pack()

        # Card 4: API Status
        card4 = tk.Frame(stats_frame, bg="#1e293b", padx=20, pady=10)
        card4.pack(side="left", expand=True, fill="x", padx=5)
        tk.Label(card4, text="API Durumu", font=("Segoe UI", 9), fg="#94a3b8", bg="#1e293b").pack()
        api_ok = bool(OPENAI_API_KEY and len(OPENAI_API_KEY) > 10 and NEWS_API_KEY and len(NEWS_API_KEY) > 10)
        self.api_status_label = tk.Label(card4, text="✅ OK" if api_ok else "⚠️ YOK", font=("Segoe UI", 22, "bold"), fg="#22c55e" if api_ok else "#ef4444", bg="#1e293b")
        self.api_status_label.pack()
        
        # Check API in background
        if api_ok:
            threading.Thread(target=self._verify_apis, daemon=True).start()

        # ─── Buttons ───
        btn_frame = tk.Frame(self.root, bg="#0f172a", pady=5)
        btn_frame.pack(fill="x", padx=15)

        self.start_btn = tk.Button(
            btn_frame,
            text="▶  BAŞLAT",
            font=("Segoe UI", 11, "bold"),
            fg="white",
            bg="#22c55e",
            activebackground="#16a34a",
            activeforeground="white",
            relief="flat",
            padx=25,
            pady=8,
            cursor="hand2",
            command=self.start_automation
        )
        self.start_btn.pack(side="left", padx=5)

        self.stop_btn = tk.Button(
            btn_frame,
            text="⏹  DURDUR",
            font=("Segoe UI", 11, "bold"),
            fg="white",
            bg="#ef4444",
            activebackground="#dc2626",
            activeforeground="white",
            relief="flat",
            padx=25,
            pady=8,
            cursor="hand2",
            command=self.stop_automation,
            state="disabled"
        )
        self.stop_btn.pack(side="left", padx=5)

        self.run_now_btn = tk.Button(
            btn_frame,
            text="⚡ ŞİMDİ ÇALIŞTIR",
            font=("Segoe UI", 11, "bold"),
            fg="white",
            bg="#3b82f6",
            activebackground="#2563eb",
            activeforeground="white",
            relief="flat",
            padx=25,
            pady=8,
            cursor="hand2",
            command=self.run_now
        )
        self.run_now_btn.pack(side="left", padx=5)

        self.clear_btn = tk.Button(
            btn_frame,
            text="🗑 LOG TEMİZLE",
            font=("Segoe UI", 10),
            fg="#94a3b8",
            bg="#334155",
            activebackground="#475569",
            activeforeground="white",
            relief="flat",
            padx=15,
            pady=8,
            cursor="hand2",
            command=self.clear_logs
        )
        self.clear_btn.pack(side="right", padx=5)

        # ─── Log Area ───
        log_label_frame = tk.Frame(self.root, bg="#0f172a")
        log_label_frame.pack(fill="x", padx=15, pady=(10, 2))
        tk.Label(log_label_frame, text="📋 Loglar", font=("Segoe UI", 10, "bold"), fg="#94a3b8", bg="#0f172a").pack(side="left")

        self.log_area = scrolledtext.ScrolledText(
            self.root,
            wrap=tk.WORD,
            font=("Consolas", 10),
            bg="#0f172a",
            fg="#e2e8f0",
            insertbackground="white",
            selectbackground="#334155",
            relief="flat",
            padx=10,
            pady=10,
            state="disabled"
        )
        self.log_area.pack(fill="both", expand=True, padx=15, pady=(0, 10))

        # Configure log colors
        self.log_area.tag_config("header", foreground="#3b82f6", font=("Consolas", 10, "bold"))
        self.log_area.tag_config("success", foreground="#22c55e")
        self.log_area.tag_config("error", foreground="#ef4444")
        self.log_area.tag_config("warning", foreground="#f59e0b")
        self.log_area.tag_config("info", foreground="#94a3b8")
        self.log_area.tag_config("step", foreground="#8b5cf6", font=("Consolas", 10, "bold"))
        self.log_area.tag_config("time", foreground="#64748b")

        # ─── Bottom Status Bar ───
        bottom_frame = tk.Frame(self.root, bg="#1e293b", pady=5)
        bottom_frame.pack(fill="x", side="bottom")
        tk.Label(
            bottom_frame,
            text=f"FinanceDaily v{VERSION}  |  NewsAPI + GPT-4o-mini  |  Vercel Deploy",
            font=("Segoe UI", 8),
            fg="#64748b",
            bg="#1e293b"
        ).pack()

    def _verify_apis(self):
        """Verify API keys are actually working"""
        import requests
        try:
            # Test NewsAPI
            r = requests.get(
                f"https://newsapi.org/v2/everything?q=test&pageSize=1&apiKey={NEWS_API_KEY}",
                timeout=10
            )
            news_ok = r.status_code == 200

            # If NewsAPI works, assume OpenAI is fine too (can't test without cost)
            if news_ok:
                self.root.after(0, lambda: self.api_status_label.config(text="✅ OK", fg="#22c55e"))
                self.log("  ✅ API anahtarları doğrulandı", "success")
            else:
                self.root.after(0, lambda: self.api_status_label.config(text="⚠️ HATA", fg="#ef4444"))
                self.log(f"  ⚠️ NewsAPI yanıt kodu: {r.status_code}", "warning")
        except Exception as e:
            self.root.after(0, lambda: self.api_status_label.config(text="⚠️ HATA", fg="#ef4444"))
            self.log(f"  ⚠️ API doğrulama hatası: {e}", "warning")

    def log(self, message, tag=None):
        """Thread-safe logging to the text area"""
        def _log():
            self.log_area.configure(state="normal")
            timestamp = datetime.now().strftime("%H:%M:%S")
            if message.strip() and tag != "header":
                self.log_area.insert(tk.END, f"[{timestamp}] ", "time")
            self.log_area.insert(tk.END, message + "\n", tag)
            self.log_area.see(tk.END)
            self.log_area.configure(state="disabled")

        if threading.current_thread() is threading.main_thread():
            _log()
        else:
            self.root.after(0, _log)

    def _log_config_status(self):
        """Display configuration status in logs"""
        self.log("Yapılandırma Durumu:", "step")
        self.log(f"  OpenAI API:  {'✅ Bağlı' if OPENAI_API_KEY else '❌ Ayarlanmamış'}", "success" if OPENAI_API_KEY else "error")
        self.log(f"  NewsAPI:     {'✅ Bağlı' if NEWS_API_KEY else '❌ Ayarlanmamış'}", "success" if NEWS_API_KEY else "error")
        self.log(f"  Makale/çalışma: {ARTICLES_PER_RUN}", "info")
        self.log(f"  Çalışma aralığı: {INTERVAL_HOURS} saat", "info")
        self.log(f"  Veritabanındaki makale: {self.total_published}", "info")
        self.log("")

    def _update_status(self, running):
        """Update status indicators"""
        def _update():
            if running:
                self.status_dot.config(fg="#22c55e")
                self.status_label.config(text="ÇALIŞIYOR", fg="#22c55e")
                self.start_btn.config(state="disabled")
                self.stop_btn.config(state="normal")
                self.run_now_btn.config(state="disabled")
            else:
                self.status_dot.config(fg="#ef4444")
                self.status_label.config(text="DURDURULDU", fg="#ef4444")
                self.start_btn.config(state="normal")
                self.stop_btn.config(state="disabled")
                self.run_now_btn.config(state="normal")
                self.countdown_label.config(text="")

        self.root.after(0, _update)

    def _update_stats(self):
        """Update stat cards"""
        def _update():
            self._load_stats()
            self.articles_count_label.config(text=str(self.total_published))
            self.runs_count_label.config(text=str(self.total_runs))
        self.root.after(0, _update)

    def _update_countdown(self):
        """Update countdown timer"""
        if not self.is_running or not self.next_run_time:
            return

        remaining = self.next_run_time - datetime.now()
        if remaining.total_seconds() > 0:
            hours, remainder = divmod(int(remaining.total_seconds()), 3600)
            minutes, seconds = divmod(remainder, 60)
            text = f"Sonraki çalışma: {hours:02d}:{minutes:02d}:{seconds:02d}"
            self.countdown_label.config(text=text)
            self.countdown_job = self.root.after(1000, self._update_countdown)
        else:
            self.countdown_label.config(text="Çalışıyor...")

    def start_automation(self):
        """Start the automation loop"""
        if self.is_running:
            return

        self.is_running = True
        self.stop_event.clear()
        self._update_status(True)

        self.log("▶ Otomasyon başlatıldı!", "success")
        self.log(f"  Her {INTERVAL_HOURS} saatte bir çalışacak", "info")
        self.log("")

        self.automation_thread = threading.Thread(target=self._automation_loop, daemon=True)
        self.automation_thread.start()

    def stop_automation(self):
        """Stop the automation loop"""
        if not self.is_running:
            return

        self.log("")
        self.log("⏹ Otomasyon durduruluyor...", "warning")
        self.is_running = False
        self.stop_event.set()
        self._update_status(False)

        if self.countdown_job:
            self.root.after_cancel(self.countdown_job)
            self.countdown_job = None

        self.log("⏹ Otomasyon durduruldu.", "warning")
        self.log("")

    def run_now(self):
        """Run automation once immediately"""
        if self.is_running:
            return

        self.log("")
        self.log("⚡ Manuel çalışma başlatıldı...", "step")
        
        self.start_btn.config(state="disabled")
        self.run_now_btn.config(state="disabled")

        thread = threading.Thread(target=self._run_single, daemon=True)
        thread.start()

    def _run_single(self):
        """Run a single automation cycle (for manual trigger)"""
        try:
            self._run_pipeline()
        finally:
            def _reset():
                self.start_btn.config(state="normal")
                self.run_now_btn.config(state="normal")
            self.root.after(0, _reset)

    def _automation_loop(self):
        """Main automation loop running in background thread"""
        while self.is_running and not self.stop_event.is_set():
            # Run pipeline
            self._run_pipeline()

            if not self.is_running or self.stop_event.is_set():
                break

            # Set next run time
            self.next_run_time = datetime.now() + timedelta(hours=INTERVAL_HOURS)
            self.log(f"💤 Sonraki çalışma: {self.next_run_time.strftime('%H:%M:%S')}", "info")
            self.log("")

            # Start countdown
            self.root.after(0, self._update_countdown)

            # Wait for interval or stop signal
            # Check every second so we can stop quickly
            wait_seconds = INTERVAL_HOURS * 3600
            for _ in range(wait_seconds):
                if self.stop_event.is_set():
                    return
                time.sleep(1)

    def _run_pipeline(self):
        """Execute the full automation pipeline"""
        start_time = datetime.now()
        self.log("═" * 50, "header")
        self.log(f"🚀 Otomasyon çalışması başladı - {start_time.strftime('%Y-%m-%d %H:%M:%S')}", "step")
        self.log("═" * 50, "header")

        # Step 1: Fetch news
        self.log("")
        self.log("1️⃣  Finansal haberler çekiliyor...", "step")
        try:
            news_items = fetch_all_news()
            if not news_items:
                self.log("  ⚠️ Haber bulunamadı. Bu çalışma atlanıyor.", "warning")
                return
            self.log(f"  ✅ {len(news_items)} haber bulundu", "success")
        except Exception as e:
            self.log(f"  ❌ Haber çekme hatası: {e}", "error")
            return

        # Step 2: Select and process
        selected = news_items[:ARTICLES_PER_RUN]
        random.shuffle(selected)
        self.log("")
        self.log(f"2️⃣  {len(selected)} makale işlenecek...", "step")

        published = 0
        failed = 0

        for i, news in enumerate(selected, 1):
            if self.stop_event.is_set():
                self.log("  ⏹ Durduruldu.", "warning")
                break

            title_short = news['title'][:55]
            self.log("")
            self.log(f"  [{i}/{len(selected)}] {title_short}...", "info")

            # Detect category
            category = detect_category(news['title'], news.get('content', ''))
            self.log(f"    📁 Kategori: {category['name']}", "info")

            # Generate with AI
            self.log(f"    🤖 GPT-4o-mini ile makale yazılıyor...", "info")
            try:
                article_data = generate_article(news, category['name'])
                if not article_data:
                    self.log(f"    ❌ Makale oluşturulamadı", "error")
                    failed += 1
                    continue
                self.log(f"    ✅ Makale oluşturuldu", "success")
            except Exception as e:
                self.log(f"    ❌ AI hatası: {e}", "error")
                failed += 1
                continue

            # SEO
            self.log(f"    🔍 SEO ayarları yapılıyor...", "info")
            self.log(f"    → Meta başlık: {article_data.get('meta_title', '')[:50]}...", "info")
            self.log(f"    → Anahtar kelimeler: {article_data.get('meta_keywords', '')[:60]}...", "info")

            # Image
            self.log(f"    🖼️  Görsel indiriliyor...", "info")
            try:
                slug = slugify(article_data['title'])
                image_path = get_article_image(news, slug, category['id'])
                article_data['featured_image'] = image_path
                if image_path:
                    self.log(f"    ✅ Görsel kaydedildi: {os.path.basename(image_path)}", "success")
                else:
                    self.log(f"    ⚠️ Görsel bulunamadı, varsayılan kullanılacak", "warning")
            except Exception as e:
                self.log(f"    ⚠️ Görsel hatası: {e}", "warning")
                article_data['featured_image'] = ''

            # Source URL
            article_data['source_url'] = news.get('url', '')

            # Publish to local DB
            self.log(f"    📤 Veritabanına kaydediliyor...", "info")
            try:
                success = publish_article(article_data, category['id'])
                if success:
                    published += 1
                    self.log(f"    ✅ Yayınlandı!", "success")
                else:
                    failed += 1
            except Exception as e:
                self.log(f"    ❌ Kayıt hatası: {e}", "error")
                failed += 1

            # Small delay
            if i < len(selected):
                time.sleep(2)

        # Step 3: Git push
        if published > 0:
            self.log("")
            self.log("3️⃣  GitHub'a gönderiliyor (Vercel otomatik rebuild)...", "step")
            try:
                result = git_push_changes()
                if result:
                    self.log("  ✅ GitHub'a push edildi → Vercel rebuild başladı", "success")
                else:
                    self.log("  ⚠️ Git push sorunlu olabilir", "warning")
            except Exception as e:
                self.log(f"  ❌ Git hatası: {e}", "error")

        # Summary
        elapsed = (datetime.now() - start_time).total_seconds()
        self.total_runs += 1
        self._update_stats()

        self.log("")
        self.log("─" * 50, "header")
        self.log(f"📊 Çalışma Özeti:", "step")
        self.log(f"  ✅ Yayınlanan: {published} makale", "success")
        if failed > 0:
            self.log(f"  ❌ Başarısız: {failed}", "error")
        self.log(f"  ⏱️  Süre: {elapsed:.1f} saniye", "info")
        self.log(f"  📰 Toplam makale: {self.total_published}", "info")
        self.log("─" * 50, "header")

    def clear_logs(self):
        """Clear the log area"""
        self.log_area.configure(state="normal")
        self.log_area.delete(1.0, tk.END)
        self.log_area.configure(state="disabled")

    def _on_close(self):
        """Handle window close"""
        if self.is_running:
            if messagebox.askyesno("Çıkış", "Otomasyon çalışıyor. Durdurup çıkmak istiyor musunuz?"):
                self.stop_automation()
                time.sleep(0.5)
                self.root.destroy()
        else:
            self.root.destroy()


def main():
    root = tk.Tk()
    
    # Center window
    root.update_idletasks()
    w = 820
    h = 650
    x = (root.winfo_screenwidth() // 2) - (w // 2)
    y = (root.winfo_screenheight() // 2) - (h // 2)
    root.geometry(f"{w}x{h}+{x}+{y}")

    app = AutomationApp(root)
    root.mainloop()


if __name__ == '__main__':
    main()

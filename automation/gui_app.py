"""
FinanceDaily Automation - Desktop Control Panel v2.0
Features: System tray, Article history, API usage tracking, Error notifications
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

# ─── Optional Dependencies ───────────────────────────────────
HAS_TRAY = False
HAS_NOTIFY = False

try:
    import pystray
    from PIL import Image, ImageDraw
    HAS_TRAY = True
except ImportError:
    pass

try:
    from winotify import Notification as Toast
    HAS_NOTIFY = True
except ImportError:
    pass

# ─── Directory Resolution ────────────────────────────────────
if getattr(sys, 'frozen', False):
    exe_dir = os.path.dirname(sys.executable)
    possible_paths = [
        os.path.join(exe_dir, '..'),
        exe_dir,
        os.path.join(exe_dir, 'automation'),
        os.path.join(exe_dir, 'financedaily', 'automation'),
        os.path.join(exe_dir, '..', 'automation'),
    ]
    AUTOMATION_DIR = None
    for p in possible_paths:
        if os.path.exists(os.path.join(p, 'config.py')):
            AUTOMATION_DIR = os.path.abspath(p)
            break
    if not AUTOMATION_DIR:
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

os.chdir(AUTOMATION_DIR)
sys.path.insert(0, AUTOMATION_DIR)

from config import ARTICLES_PER_RUN, OPENAI_API_KEY, NEWS_API_KEY, NEWS_TOPICS, CATEGORIES
from news_fetcher import fetch_all_news
from ai_writer import generate_article, generate_comments, get_client
from publisher import publish_article, detect_category, slugify, git_push_changes, load_database
from image_handler import get_article_image

# ─── Constants ────────────────────────────────────────────────
APP_TITLE = "FinanceDaily Automation Panel"
INTERVAL_HOURS = 2
VERSION = "2.0.0"
API_DAILY_LIMIT = 100  # NewsAPI free plan
API_USAGE_FILE = os.path.join(AUTOMATION_DIR, 'api_usage.json')
CATEGORY_MAP = {cat['id']: cat['name'] for cat in CATEGORIES.values()}


class AutomationApp:
    def __init__(self, root):
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry("900x700")
        self.root.minsize(750, 600)
        self.root.configure(bg="#0f172a")

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
        self.tray_icon = None
        self.api_requests_today = 0

        # Load data
        self._load_stats()
        self._load_api_usage()

        # Build UI
        self._setup_styles()
        self._build_ui()

        # Log startup
        self.log("═" * 60, "header")
        self.log(f"  FinanceDaily Automation Panel v{VERSION}", "header")
        if HAS_TRAY:
            self.log("  ✓ System tray desteği aktif", "info")
        if HAS_NOTIFY:
            self.log("  ✓ Windows bildirimleri aktif", "info")
        self.log("═" * 60, "header")
        self.log("")
        self._log_config_status()

        # Verify APIs in background
        api_ok = bool(OPENAI_API_KEY and len(OPENAI_API_KEY) > 10 and NEWS_API_KEY and len(NEWS_API_KEY) > 10)
        if api_ok:
            threading.Thread(target=self._verify_apis, daemon=True).start()

        # Handle close
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    # ─── Data Loading ─────────────────────────────────────────

    def _load_stats(self):
        try:
            db = load_database()
            self.total_published = len(db.get('articles', []))
        except:
            self.total_published = 0

    def _load_api_usage(self):
        """Load API usage from tracking file"""
        self.api_requests_today = 0
        try:
            if os.path.exists(API_USAGE_FILE):
                with open(API_USAGE_FILE, 'r') as f:
                    data = json.load(f)
                if data.get('date') == datetime.now().strftime('%Y-%m-%d'):
                    self.api_requests_today = data.get('requests', 0)
        except:
            pass

    def _save_api_usage(self):
        """Persist API usage to file"""
        try:
            with open(API_USAGE_FILE, 'w') as f:
                json.dump({
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'requests': self.api_requests_today
                }, f)
        except:
            pass

    def _track_api_calls(self, count):
        """Track N API calls"""
        today = datetime.now().strftime('%Y-%m-%d')
        try:
            if os.path.exists(API_USAGE_FILE):
                with open(API_USAGE_FILE, 'r') as f:
                    data = json.load(f)
                if data.get('date') != today:
                    self.api_requests_today = 0
        except:
            pass
        self.api_requests_today += count
        self._save_api_usage()
        self._update_api_display()

    # ─── Styles ───────────────────────────────────────────────

    def _setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')

        # Notebook tabs
        style.configure("Dark.TNotebook", background="#0f172a", borderwidth=0)
        style.configure("Dark.TNotebook.Tab",
            background="#1e293b", foreground="#94a3b8",
            padding=[20, 8], font=("Segoe UI", 10, "bold"))
        style.map("Dark.TNotebook.Tab",
            background=[('selected', '#2563eb')],
            foreground=[('selected', 'white')])

        # Treeview
        style.configure("Dark.Treeview",
            background="#0f172a", foreground="#e2e8f0",
            fieldbackground="#0f172a", rowheight=30,
            font=("Segoe UI", 9))
        style.configure("Dark.Treeview.Heading",
            background="#1e293b", foreground="#94a3b8",
            font=("Segoe UI", 9, "bold"))
        style.map("Dark.Treeview",
            background=[('selected', '#1e40af')],
            foreground=[('selected', 'white')])

    # ─── UI Building ─────────────────────────────────────────

    def _build_ui(self):
        # ─── Header ───
        header_frame = tk.Frame(self.root, bg="#1e293b", pady=12)
        header_frame.pack(fill="x")

        tk.Label(header_frame, text="📰 FinanceDaily",
            font=("Segoe UI", 18, "bold"), fg="#3b82f6", bg="#1e293b"
        ).pack(side="left", padx=20)

        tk.Label(header_frame, text="Automation Control Panel",
            font=("Segoe UI", 11), fg="#94a3b8", bg="#1e293b"
        ).pack(side="left", padx=5)

        if HAS_TRAY:
            tk.Label(header_frame, text="✕ = Tray'e küçült",
                font=("Segoe UI", 8), fg="#64748b", bg="#1e293b"
            ).pack(side="right", padx=20)

        # ─── Status Bar ───
        status_frame = tk.Frame(self.root, bg="#1e293b", pady=8)
        status_frame.pack(fill="x", padx=10, pady=(10, 5))

        self.status_dot = tk.Label(status_frame, text="●",
            font=("Segoe UI", 16), fg="#ef4444", bg="#1e293b")
        self.status_dot.pack(side="left", padx=(15, 5))

        self.status_label = tk.Label(status_frame, text="DURDURULDU",
            font=("Segoe UI", 12, "bold"), fg="#ef4444", bg="#1e293b")
        self.status_label.pack(side="left", padx=5)

        self.countdown_label = tk.Label(status_frame, text="",
            font=("Segoe UI", 10), fg="#94a3b8", bg="#1e293b")
        self.countdown_label.pack(side="right", padx=15)

        # ─── Stats Cards ───
        stats_frame = tk.Frame(self.root, bg="#0f172a")
        stats_frame.pack(fill="x", padx=10, pady=5)

        # Card 1: Total Articles
        card1 = tk.Frame(stats_frame, bg="#1e293b", padx=20, pady=10)
        card1.pack(side="left", expand=True, fill="x", padx=5)
        tk.Label(card1, text="Toplam Makale", font=("Segoe UI", 9),
            fg="#94a3b8", bg="#1e293b").pack()
        self.articles_count_label = tk.Label(card1, text=str(self.total_published),
            font=("Segoe UI", 22, "bold"), fg="#22c55e", bg="#1e293b")
        self.articles_count_label.pack()

        # Card 2: Total Runs
        card2 = tk.Frame(stats_frame, bg="#1e293b", padx=20, pady=10)
        card2.pack(side="left", expand=True, fill="x", padx=5)
        tk.Label(card2, text="Toplam Çalışma", font=("Segoe UI", 9),
            fg="#94a3b8", bg="#1e293b").pack()
        self.runs_count_label = tk.Label(card2, text="0",
            font=("Segoe UI", 22, "bold"), fg="#3b82f6", bg="#1e293b")
        self.runs_count_label.pack()

        # Card 3: API Usage
        card3 = tk.Frame(stats_frame, bg="#1e293b", padx=20, pady=10)
        card3.pack(side="left", expand=True, fill="x", padx=5)
        tk.Label(card3, text="API Kullanım (Günlük)", font=("Segoe UI", 9),
            fg="#94a3b8", bg="#1e293b").pack()
        api_color = self._get_api_color()
        self.api_usage_label = tk.Label(card3,
            text=f"{self.api_requests_today}/{API_DAILY_LIMIT}",
            font=("Segoe UI", 22, "bold"), fg=api_color, bg="#1e293b")
        self.api_usage_label.pack()

        # Card 4: Interval
        card4 = tk.Frame(stats_frame, bg="#1e293b", padx=20, pady=10)
        card4.pack(side="left", expand=True, fill="x", padx=5)
        tk.Label(card4, text="Çalışma Aralığı", font=("Segoe UI", 9),
            fg="#94a3b8", bg="#1e293b").pack()
        tk.Label(card4, text=f"{INTERVAL_HOURS} Saat",
            font=("Segoe UI", 22, "bold"), fg="#f59e0b", bg="#1e293b").pack()

        # ─── Buttons ───
        btn_frame = tk.Frame(self.root, bg="#0f172a", pady=5)
        btn_frame.pack(fill="x", padx=15)

        self.start_btn = tk.Button(btn_frame, text="▶  BAŞLAT",
            font=("Segoe UI", 11, "bold"), fg="white", bg="#22c55e",
            activebackground="#16a34a", activeforeground="white",
            relief="flat", padx=25, pady=8, cursor="hand2",
            command=self.start_automation)
        self.start_btn.pack(side="left", padx=5)

        self.stop_btn = tk.Button(btn_frame, text="⏹  DURDUR",
            font=("Segoe UI", 11, "bold"), fg="white", bg="#ef4444",
            activebackground="#dc2626", activeforeground="white",
            relief="flat", padx=25, pady=8, cursor="hand2",
            command=self.stop_automation, state="disabled")
        self.stop_btn.pack(side="left", padx=5)

        self.run_now_btn = tk.Button(btn_frame, text="⚡ ŞİMDİ ÇALIŞTIR",
            font=("Segoe UI", 11, "bold"), fg="white", bg="#3b82f6",
            activebackground="#2563eb", activeforeground="white",
            relief="flat", padx=25, pady=8, cursor="hand2",
            command=self.run_now)
        self.run_now_btn.pack(side="left", padx=5)

        # Right side buttons
        if HAS_TRAY:
            quit_btn = tk.Button(btn_frame, text="❌ ÇIKIŞ",
                font=("Segoe UI", 10), fg="#94a3b8", bg="#334155",
                activebackground="#475569", activeforeground="white",
                relief="flat", padx=15, pady=8, cursor="hand2",
                command=self._quit_app)
            quit_btn.pack(side="right", padx=5)

        clear_btn = tk.Button(btn_frame, text="🗑 LOG TEMİZLE",
            font=("Segoe UI", 10), fg="#94a3b8", bg="#334155",
            activebackground="#475569", activeforeground="white",
            relief="flat", padx=15, pady=8, cursor="hand2",
            command=self.clear_logs)
        clear_btn.pack(side="right", padx=5)

        # ─── Tabs ───
        self.notebook = ttk.Notebook(self.root, style="Dark.TNotebook")
        self.notebook.pack(fill="both", expand=True, padx=15, pady=(10, 10))

        # Tab 1: Logs
        log_frame = tk.Frame(self.notebook, bg="#0f172a")
        self.notebook.add(log_frame, text="  📋 Loglar  ")
        self._build_log_tab(log_frame)

        # Tab 2: History
        history_frame = tk.Frame(self.notebook, bg="#0f172a")
        self.notebook.add(history_frame, text="  📜 Makale Geçmişi  ")
        self._build_history_tab(history_frame)

        # ─── Bottom Bar ───
        bottom_frame = tk.Frame(self.root, bg="#1e293b", pady=5)
        bottom_frame.pack(fill="x", side="bottom")
        tray_text = "  |  ✕ ile tray'e küçülür" if HAS_TRAY else ""
        tk.Label(bottom_frame,
            text=f"FinanceDaily v{VERSION}  |  NewsAPI + GPT-4o-mini  |  Vercel Deploy{tray_text}",
            font=("Segoe UI", 8), fg="#64748b", bg="#1e293b").pack()

    def _build_log_tab(self, parent):
        """Build the log text area"""
        self.log_area = scrolledtext.ScrolledText(parent,
            wrap=tk.WORD, font=("Consolas", 10),
            bg="#0f172a", fg="#e2e8f0", insertbackground="white",
            selectbackground="#334155", relief="flat", padx=10, pady=10,
            state="disabled")
        self.log_area.pack(fill="both", expand=True)

        self.log_area.tag_config("header", foreground="#3b82f6", font=("Consolas", 10, "bold"))
        self.log_area.tag_config("success", foreground="#22c55e")
        self.log_area.tag_config("error", foreground="#ef4444")
        self.log_area.tag_config("warning", foreground="#f59e0b")
        self.log_area.tag_config("info", foreground="#94a3b8")
        self.log_area.tag_config("step", foreground="#8b5cf6", font=("Consolas", 10, "bold"))
        self.log_area.tag_config("time", foreground="#64748b")

    def _build_history_tab(self, parent):
        """Build the article history viewer"""
        # Toolbar
        toolbar = tk.Frame(parent, bg="#0f172a", pady=8)
        toolbar.pack(fill="x")

        tk.Button(toolbar, text="🔄 Yenile",
            font=("Segoe UI", 10, "bold"), fg="white", bg="#3b82f6",
            activebackground="#2563eb", activeforeground="white",
            relief="flat", padx=15, pady=5, cursor="hand2",
            command=self._refresh_history).pack(side="left", padx=5)

        self.history_count_label = tk.Label(toolbar, text="",
            font=("Segoe UI", 9), fg="#94a3b8", bg="#0f172a")
        self.history_count_label.pack(side="right", padx=10)

        # Treeview
        tree_frame = tk.Frame(parent, bg="#0f172a")
        tree_frame.pack(fill="both", expand=True)

        columns = ('no', 'title', 'category', 'date', 'views')
        self.history_tree = ttk.Treeview(tree_frame, columns=columns,
            show='headings', style="Dark.Treeview")

        self.history_tree.heading('no', text='#')
        self.history_tree.heading('title', text='Başlık')
        self.history_tree.heading('category', text='Kategori')
        self.history_tree.heading('date', text='Tarih')
        self.history_tree.heading('views', text='Okunma')

        self.history_tree.column('no', width=45, anchor='center')
        self.history_tree.column('title', width=420, anchor='w')
        self.history_tree.column('category', width=110, anchor='center')
        self.history_tree.column('date', width=140, anchor='center')
        self.history_tree.column('views', width=80, anchor='center')

        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical",
            command=self.history_tree.yview)
        self.history_tree.configure(yscrollcommand=scrollbar.set)

        self.history_tree.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # Auto-refresh when tab is selected
        self.notebook.bind("<<NotebookTabChanged>>", self._on_tab_change)

    def _on_tab_change(self, event):
        if self.notebook.index("current") == 1:
            self._refresh_history()

    def _refresh_history(self):
        """Reload article history from database"""
        for item in self.history_tree.get_children():
            self.history_tree.delete(item)
        try:
            db = load_database()
            articles = db.get('articles', [])
            articles_sorted = sorted(articles,
                key=lambda a: a.get('created_at', ''), reverse=True)

            for i, article in enumerate(articles_sorted, 1):
                cat_id = article.get('category_id', 0)
                cat_name = CATEGORY_MAP.get(cat_id, 'Unknown')

                date_str = article.get('created_at', '')
                try:
                    dt = datetime.fromisoformat(
                        date_str.replace('Z', '').replace('.000', ''))
                    date_display = dt.strftime('%Y-%m-%d %H:%M')
                except:
                    date_display = date_str[:16] if date_str else '-'

                views = article.get('views', 0)
                views_display = f"{views:,}" if views else "0"

                title = article.get('title', 'Untitled')
                if len(title) > 65:
                    title = title[:62] + "..."

                self.history_tree.insert('', 'end', values=(
                    i, title, cat_name, date_display, views_display
                ))

            self.history_count_label.config(
                text=f"Toplam: {len(articles)} makale")
        except Exception as e:
            self.history_count_label.config(text=f"Hata: {e}")

    # ─── API Display ──────────────────────────────────────────

    def _get_api_color(self):
        pct = self.api_requests_today / max(API_DAILY_LIMIT, 1)
        if pct < 0.6:
            return "#22c55e"
        elif pct < 0.85:
            return "#f59e0b"
        else:
            return "#ef4444"

    def _update_api_display(self):
        def _update():
            color = self._get_api_color()
            self.api_usage_label.config(
                text=f"{self.api_requests_today}/{API_DAILY_LIMIT}",
                fg=color)
        self.root.after(0, _update)

    # ─── Notifications ────────────────────────────────────────

    def _notify(self, title, message):
        """Send a Windows toast notification"""
        if not HAS_NOTIFY:
            return
        try:
            toast = Toast(app_id="FinanceDaily Automation",
                title=title, msg=message, duration="short")
            toast.show()
        except:
            pass

    def _notify_error(self, title, message):
        """Send error toast notification"""
        if not HAS_NOTIFY:
            return
        try:
            toast = Toast(app_id="FinanceDaily Automation",
                title=f"⚠️ {title}", msg=message, duration="long")
            toast.show()
        except:
            pass

    # ─── System Tray ──────────────────────────────────────────

    def _create_tray_icon(self):
        """Create a system tray icon with context menu"""
        if not HAS_TRAY:
            return None

        # Create blue circle with white "F" letter
        img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.ellipse([2, 2, 62, 62], fill='#2563eb')
        draw.rectangle([20, 14, 25, 50], fill='white')   # vertical bar
        draw.rectangle([20, 14, 44, 19], fill='white')   # top horizontal
        draw.rectangle([20, 29, 40, 34], fill='white')   # middle horizontal

        menu = pystray.Menu(
            pystray.MenuItem('Göster', self._show_from_tray, default=True),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem('Başlat', lambda icon, item: self.root.after(0, self.start_automation)),
            pystray.MenuItem('Durdur', lambda icon, item: self.root.after(0, self.stop_automation)),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem('Çıkış', self._quit_from_tray),
        )

        return pystray.Icon("FinanceDaily", img, "FinanceDaily Automation", menu)

    def _minimize_to_tray(self):
        """Hide window and show tray icon"""
        if not HAS_TRAY:
            return False

        self.root.withdraw()

        if self.tray_icon:
            try:
                self.tray_icon.stop()
            except:
                pass

        self.tray_icon = self._create_tray_icon()
        if self.tray_icon:
            threading.Thread(target=self.tray_icon.run, daemon=True).start()
            self._notify("FinanceDaily",
                "Uygulama arka planda çalışmaya devam ediyor.\n"
                "Tray ikonuna çift tıklayarak geri açabilirsiniz.")
            return True
        return False

    def _show_from_tray(self, icon=None, item=None):
        """Restore window from tray"""
        if self.tray_icon:
            try:
                self.tray_icon.stop()
            except:
                pass
            self.tray_icon = None
        self.root.after(0, self.root.deiconify)
        self.root.after(100, self.root.lift)

    def _quit_from_tray(self, icon=None, item=None):
        """Quit application from tray"""
        if self.is_running:
            self.stop_event.set()
            self.is_running = False
        if self.tray_icon:
            try:
                self.tray_icon.stop()
            except:
                pass
        self.root.after(0, self.root.destroy)

    def _quit_app(self):
        """Quit button action (with confirmation if running)"""
        if self.is_running:
            if messagebox.askyesno("Çıkış",
                    "Otomasyon çalışıyor. Durdurup çıkmak istiyor musunuz?"):
                self.stop_automation()
                time.sleep(0.5)
                self.root.destroy()
        else:
            self.root.destroy()

    # ─── Logging ──────────────────────────────────────────────

    def log(self, message, tag=None):
        """Thread-safe logging"""
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
        self.log("Yapılandırma Durumu:", "step")
        self.log(f"  OpenAI API:  {'✅ Bağlı' if OPENAI_API_KEY else '❌ Ayarlanmamış'}",
            "success" if OPENAI_API_KEY else "error")
        self.log(f"  NewsAPI:     {'✅ Bağlı' if NEWS_API_KEY else '❌ Ayarlanmamış'}",
            "success" if NEWS_API_KEY else "error")
        self.log(f"  API Kullanım: {self.api_requests_today}/{API_DAILY_LIMIT} (bugün)", "info")
        self.log(f"  Makale/çalışma: {ARTICLES_PER_RUN}", "info")
        self.log(f"  Çalışma aralığı: {INTERVAL_HOURS} saat", "info")
        self.log(f"  Veritabanındaki makale: {self.total_published}", "info")
        self.log(f"  Tray desteği: {'✅' if HAS_TRAY else '❌ (pystray/Pillow yükle)'}", "info")
        self.log(f"  Bildirimler:  {'✅' if HAS_NOTIFY else '❌ (winotify yükle)'}", "info")
        self.log("")

    def _verify_apis(self):
        """Verify API keys in background"""
        import requests
        try:
            r = requests.get(
                f"https://newsapi.org/v2/everything?q=test&pageSize=1&apiKey={NEWS_API_KEY}",
                timeout=10)
            if r.status_code == 200:
                self.log("  ✅ API anahtarları doğrulandı", "success")
            else:
                self.log(f"  ⚠️ NewsAPI yanıt kodu: {r.status_code}", "warning")
                self._notify_error("API Hatası", f"NewsAPI yanıt kodu: {r.status_code}")
        except Exception as e:
            self.log(f"  ⚠️ API doğrulama hatası: {e}", "warning")
            self._notify_error("API Hatası", f"API doğrulama başarısız: {e}")

    # ─── Status Updates ───────────────────────────────────────

    def _update_status(self, running):
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
        def _update():
            self._load_stats()
            self.articles_count_label.config(text=str(self.total_published))
            self.runs_count_label.config(text=str(self.total_runs))
        self.root.after(0, _update)

    def _update_countdown(self):
        if not self.is_running or not self.next_run_time:
            return
        remaining = self.next_run_time - datetime.now()
        if remaining.total_seconds() > 0:
            hours, remainder = divmod(int(remaining.total_seconds()), 3600)
            minutes, seconds = divmod(remainder, 60)
            self.countdown_label.config(
                text=f"Sonraki çalışma: {hours:02d}:{minutes:02d}:{seconds:02d}")
            self.countdown_job = self.root.after(1000, self._update_countdown)
        else:
            self.countdown_label.config(text="Çalışıyor...")

    # ─── Automation Controls ──────────────────────────────────

    def start_automation(self):
        if self.is_running:
            return
        self.is_running = True
        self.stop_event.clear()
        self._update_status(True)
        self.log("▶ Otomasyon başlatıldı!", "success")
        self.log(f"  Her {INTERVAL_HOURS} saatte bir çalışacak", "info")
        self.log(f"  İlk çalışma {INTERVAL_HOURS} saat sonra başlayacak", "info")
        self.log(f"  (Haber toplama sıfır noktası: şimdi)", "info")
        self.log("")
        self.automation_thread = threading.Thread(target=self._automation_loop, daemon=True)
        self.automation_thread.start()

    def stop_automation(self):
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
        if self.is_running:
            return
        self.log("")
        self.log("⚡ Manuel çalışma başlatıldı...", "step")
        self.start_btn.config(state="disabled")
        self.run_now_btn.config(state="disabled")
        thread = threading.Thread(target=self._run_single, daemon=True)
        thread.start()

    def _run_single(self):
        try:
            self._run_pipeline()
        finally:
            def _reset():
                self.start_btn.config(state="normal")
                self.run_now_btn.config(state="normal")
            self.root.after(0, _reset)

    def _automation_loop(self):
        # İlk çalışmada da önce bekle — exe açıldığı andan itibaren haber toplamaya başla
        while self.is_running and not self.stop_event.is_set():
            # Önce bekle, sonra çalıştır
            self.next_run_time = datetime.now() + timedelta(hours=INTERVAL_HOURS)
            self.log(f"💤 Sonraki çalışma: {self.next_run_time.strftime('%H:%M:%S')}", "info")
            self.log("")
            self.root.after(0, self._update_countdown)
            wait_seconds = INTERVAL_HOURS * 3600
            for _ in range(wait_seconds):
                if self.stop_event.is_set():
                    return
                time.sleep(1)
            # Bekleme bitti, şimdi çalıştır
            if not self.is_running or self.stop_event.is_set():
                break
            self._run_pipeline()

    # ─── Pipeline ─────────────────────────────────────────────

    def _run_pipeline(self):
        start_time = datetime.now()
        self.log("═" * 50, "header")
        self.log(f"🚀 Otomasyon çalışması başladı - {start_time.strftime('%Y-%m-%d %H:%M:%S')}", "step")
        self.log("═" * 50, "header")

        # Check API limit
        if self.api_requests_today >= API_DAILY_LIMIT:
            self.log("")
            self.log("⚠️ Günlük API limiti doldu! Çalışma atlanıyor.", "error")
            self._notify_error("API Limiti",
                f"Günlük {API_DAILY_LIMIT} istek limitine ulaşıldı. Yarın sıfırlanacak.")
            return

        # Step 1: Fetch news (only from last INTERVAL_HOURS + 1 hour buffer)
        self.log("")
        self.log("1️⃣  Finansal haberler çekiliyor...", "step")
        try:
            hours_back = INTERVAL_HOURS + 1  # 2 saat interval + 1 saat buffer
            news_items = fetch_all_news(hours_back=hours_back)

            # Track API calls (each topic = 1 API call)
            api_calls = len(NEWS_TOPICS)
            self._track_api_calls(api_calls)
            self.log(f"  📊 API kullanım: {self.api_requests_today}/{API_DAILY_LIMIT}", "info")

            if not news_items:
                self.log("  ⚠️ Haber bulunamadı. Bu çalışma atlanıyor.", "warning")
                self._notify_error("Haber Bulunamadı", "Yeni haber bulunamadı, çalışma atlandı.")
                return
            self.log(f"  ✅ {len(news_items)} haber bulundu", "success")
        except Exception as e:
            self.log(f"  ❌ Haber çekme hatası: {e}", "error")
            self._notify_error("Haber Hatası", str(e)[:100])
            return

        # Step 2: Process articles
        selected = news_items[:ARTICLES_PER_RUN]
        random.shuffle(selected)
        self.log("")
        self.log(f"2️⃣  {len(selected)} makale işlenecek...", "step")

        published = 0
        failed = 0
        errors = []

        for i, news in enumerate(selected, 1):
            if self.stop_event.is_set():
                self.log("  ⏹ Durduruldu.", "warning")
                break

            title_short = news['title'][:55]
            self.log("")
            self.log(f"  [{i}/{len(selected)}] {title_short}...", "info")

            category = detect_category(news['title'], news.get('content', ''))
            self.log(f"    📁 Kategori: {category['name']}", "info")

            self.log(f"    🤖 GPT-4o-mini ile makale yazılıyor...", "info")
            try:
                article_data = generate_article(news, category['name'])
                if not article_data:
                    self.log(f"    ❌ Makale oluşturulamadı", "error")
                    failed += 1
                    errors.append(f"AI: {title_short}")
                    continue
                self.log(f"    ✅ Makale oluşturuldu", "success")
            except Exception as e:
                self.log(f"    ❌ AI hatası: {e}", "error")
                failed += 1
                errors.append(f"AI hatası: {str(e)[:50]}")
                continue

            self.log(f"    🔍 SEO ayarları yapılıyor...", "info")
            self.log(f"    🖼️  Görsel indiriliyor...", "info")
            try:
                slug = slugify(article_data['title'])
                image_path = get_article_image(news, slug, category['id'])
                article_data['featured_image'] = image_path
                if image_path:
                    self.log(f"    ✅ Görsel kaydedildi", "success")
                else:
                    self.log(f"    ⚠️ Görsel bulunamadı", "warning")
            except Exception as e:
                self.log(f"    ⚠️ Görsel hatası: {e}", "warning")
                article_data['featured_image'] = ''

            article_data['source_url'] = news.get('url', '')

            # Generate comments
            self.log(f"    💬 Yorumlar oluşturuluyor...", "info")
            try:
                ai_client = get_client()
                if ai_client:
                    comments = generate_comments(ai_client, article_data['title'], article_data.get('excerpt', ''), category['name'])
                    article_data['comments'] = comments
                    self.log(f"    ✅ {len(comments)} yorum oluşturuldu", "success")
                else:
                    article_data['comments'] = []
            except Exception as e:
                self.log(f"    ⚠️ Yorum hatası: {e}", "warning")
                article_data['comments'] = []

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
                errors.append(f"DB hatası: {str(e)[:50]}")

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
                    self._notify_error("Git Hatası",
                        "Git push başarısız oldu. Manuel kontrol gerekebilir.")
            except Exception as e:
                self.log(f"  ❌ Git hatası: {e}", "error")
                self._notify_error("Git Hatası", str(e)[:100])

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
        self.log(f"  📊 API kullanım: {self.api_requests_today}/{API_DAILY_LIMIT}", "info")
        self.log(f"  ⏱️  Süre: {elapsed:.1f} saniye", "info")
        self.log(f"  📰 Toplam makale: {self.total_published}", "info")
        self.log("─" * 50, "header")

        # Send completion/error notification
        if published > 0:
            self._notify("Çalışma Tamamlandı",
                f"✅ {published} makale yayınlandı\n📰 Toplam: {self.total_published}")
        elif failed > 0:
            self._notify_error("Çalışma Başarısız",
                f"❌ {failed} makale başarısız oldu\n" + "\n".join(errors[:3]))

        # API limit warning
        if self.api_requests_today >= API_DAILY_LIMIT * 0.85:
            self.log("")
            self.log(f"⚠️ API limiti azalıyor: {self.api_requests_today}/{API_DAILY_LIMIT}", "warning")
            self._notify_error("API Uyarısı",
                f"Günlük API limiti azalıyor: {self.api_requests_today}/{API_DAILY_LIMIT}")

    # ─── UI Actions ───────────────────────────────────────────

    def clear_logs(self):
        self.log_area.configure(state="normal")
        self.log_area.delete(1.0, tk.END)
        self.log_area.configure(state="disabled")

    def _on_close(self):
        """Handle window close - minimize to tray or ask to quit"""
        if HAS_TRAY:
            self._minimize_to_tray()
        else:
            if self.is_running:
                if messagebox.askyesno("Çıkış",
                        "Otomasyon çalışıyor. Durdurup çıkmak istiyor musunuz?"):
                    self.stop_automation()
                    time.sleep(0.5)
                    self.root.destroy()
            else:
                self.root.destroy()


def main():
    root = tk.Tk()
    root.update_idletasks()
    w, h = 900, 700
    x = (root.winfo_screenwidth() // 2) - (w // 2)
    y = (root.winfo_screenheight() // 2) - (h // 2)
    root.geometry(f"{w}x{h}+{x}+{y}")
    app = AutomationApp(root)
    root.mainloop()


if __name__ == '__main__':
    main()

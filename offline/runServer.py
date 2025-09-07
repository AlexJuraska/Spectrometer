import http.server
import socketserver
import threading
import webbrowser
import os
import sys
import time

if getattr(sys, 'frozen', False):
    os.chdir(sys._MEIPASS)

PORT = 8000

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

Handler = QuietHandler

server_thread = None
httpd = None
language = None

def start_server():
    global httpd, server_thread
    if httpd is not None:
        print(f"[!] {language['alreadyRunning']}.")
        return

    class ReusableTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    def run():
        global httpd
        with ReusableTCPServer(("", PORT), Handler) as httpd_local:
            httpd = httpd_local
            print(f"[✓] {language['servingAt']} http://localhost:{PORT}")
            open_site()
            httpd.serve_forever()

    server_thread = threading.Thread(target=run, daemon=True)
    server_thread.start()
    time.sleep(1)

def stop_server():
    global httpd
    if httpd:
        httpd.shutdown()
        httpd = None
        print(f"[✓] {language['stopped']}.")
    else:
        print(f"[!] {language['notRunning']}.")

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def open_site():
    if httpd is not None:
        webbrowser.open(f"http://localhost:{PORT}/src/pages/index.html")
    else:
        print(f"[!] {language['notRunning']}.")

def restart_server():
    stop_server()
    time.sleep(0.5)
    start_server()

def set_language(lang = "en"):
    global language
    if lang == "sk":
        language = {
            "title": "Nastavenia servera Spectra Web",
            "choice1": "Zapnúť server",
            "choice2": "Vypnúť server",
            "choice3": "Otvoriť stránku",
            "choice4": "Zmeniť jazyk",
            "choice5": "Odísť",
            "chooseOption": "Vyberte možnosť: ",
            "goodbye": "Dovidenia!",
            "invalidOption": "Neplatná možnosť",
            "notRunning": "Server je vypnutý",
            "stopped": "Server sa vypol",
            "servingAt": "Beží na",
            "alreadyRunning": "Server už beží"
        }
    else:
        language = {
            "title" : "Spectra Web Server Setup",
            "choice1" : "Start server",
            "choice2" : "Stop server",
            "choice3" : "Open site",
            "choice4" : "Change language",
            "choice5" : "Exit",
            "chooseOption" : "Choose an option: ",
            "goodbye" : "Goodbye!",
            "invalidOption" : "Invalid option",
            "notRunning" : "Server is not running",
            "stopped" : "Server stopped",
            "servingAt" : "Serving at",
            "alreadyRunning" : "Server is already running"
        }

def main():
    languageChoice = False
    if language is None:
        set_language()
    while True:
        print(f"========== {language['title']} ==========")
        if languageChoice:
            print(f"[1] English")
            print(f"[2] Slovenčina")
        else:
            print(f"[1] {language['choice1']}")
            print(f"[2] {language['choice2']}")
            print(f"[3] {language['choice3']}")
            print(f"[4] {language['choice4']}")
            print(f"[5] {language['choice5']}")
        print("======================================")
        choice = input(language["chooseOption"]).strip()

        clear_screen()
        if languageChoice:
            if choice == "1":
                set_language()
                languageChoice = False
            elif choice == "2":
                set_language("sk")
                languageChoice = False
            else:
                print(f"[!] {language['invalidOption']}.")
        else:
            if choice == "1":
                start_server()
            elif choice == "2":
                stop_server()
            elif choice == "3":
                open_site()
            elif choice == "4":
                languageChoice = True
            elif choice == "5":
                stop_server()
                print(language["goodbye"])
                sys.exit(0)
            else:
                print(f"[!] {language['invalidOption']}.")

if __name__ == "__main__":
    clear_screen()
    main()
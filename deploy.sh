#!/bin/bash
# 株式会社ストック・アップ サイト 本番デプロイスクリプト
#
#   ./deploy.sh                 → 本番 https://stock-up.jp  (public_html/stock-up.jp) へ全ファイル転送
#   ./deploy.sh redirect-old    → 旧ドメイン stock-up.site に「stock-up.jp へ301転送」の .htaccess だけ置く
#
# パスワードは macOS キーチェーンから読む(service: stockup-jp-ftp / stockup-ftp)。
# このファイルにも他のどこにも認証情報は書かないこと。
set -euo pipefail
cd "$(dirname "$0")"
MODE="${1:-site}"

python3 - "$MODE" <<'EOF'
import ftplib, os, subprocess, sys

MODE = sys.argv[1]
HOST = "www1215.conoha.ne.jp"
if MODE == "site":
    USER, SERVICE, REMOTE_DIR, LOCAL_DIR = "stockup@stock-up.jp", "stockup-jp-ftp", "public_html/stock-up.jp", "."
elif MODE == "redirect-old":
    USER, SERVICE, REMOTE_DIR, LOCAL_DIR = "stockup@frontway.jp", "stockup-ftp", "", "redirect-old"
else:
    sys.exit("使い方: ./deploy.sh [site|redirect-old]")

EXCLUDE_NAMES = {".gitignore", ".nojekyll", "README.md", ".DS_Store", "deploy.sh"}
EXCLUDE_DIRS = {".git", ".github", "node_modules", "redirect-old"}

pw = subprocess.run(
    ["security", "find-generic-password", "-a", USER, "-s", SERVICE, "-w"],
    capture_output=True, text=True).stdout.strip()
if not pw:
    sys.exit(f"キーチェーンにパスワードが見つかりません (service: {SERVICE}, account: {USER})")

ftps = ftplib.FTP_TLS()
ftps.connect(HOST, 21, timeout=30)
ftps.login(USER, pw)
ftps.prot_p()

# FTPアカウントの許可ディレクトリが「全て許可」なら public_html/<domain> へ降りる。
# 「ディレクトリ指定」で既にドメイン直下がルートならそのまま。
if REMOTE_DIR and "public_html" in ftps.nlst():
    ftps.cwd(REMOTE_DIR)
print("転送先:", USER, ftps.pwd())

os.chdir(LOCAL_DIR)
files = []
for root, dirs, names in os.walk("."):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
    for n in names:
        if n in EXCLUDE_NAMES:
            continue
        files.append(os.path.relpath(os.path.join(root, n)))

def ensure_dir(path):
    cur = ""
    for p in path.split("/")[:-1]:
        cur = f"{cur}/{p}" if cur else p
        try:
            ftps.mkd(cur)
        except ftplib.error_perm:
            pass

failed = []
for f in sorted(files):
    ensure_dir(f)
    with open(f, "rb") as fp:
        ftps.storbinary(f"STOR {f}", fp)
    if ftps.size(f) != os.path.getsize(f):
        failed.append(f)
        print("NG", f)
    else:
        print("OK", f)

ftps.quit()
if failed:
    sys.exit(f"サイズ不一致: {failed}")
print(f"\nデプロイ完了({MODE}): {len(files)} ファイル")
EOF

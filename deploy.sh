#!/bin/bash
# stock-up.site 本番デプロイスクリプト
# 使い方: ./deploy.sh
# パスワードは macOS キーチェーン（service: stockup-ftp）から読み取る。
# このファイルにも他のどこにも認証情報は書かないこと。
set -euo pipefail
cd "$(dirname "$0")"

python3 <<'EOF'
import ftplib, os, subprocess, sys

HOST = "www1215.conoha.ne.jp"
USER = "stockup@frontway.jp"
EXCLUDE_NAMES = {".gitignore", ".nojekyll", "README.md", ".DS_Store", "deploy.sh"}
EXCLUDE_DIRS = {".git", ".github", "node_modules"}

pw = subprocess.run(
    ["security", "find-generic-password", "-a", USER, "-s", "stockup-ftp", "-w"],
    capture_output=True, text=True).stdout.strip()
if not pw:
    sys.exit("キーチェーンにパスワードが見つかりません (service: stockup-ftp)")

ftps = ftplib.FTP_TLS()
ftps.connect(HOST, 21, timeout=30)
ftps.login(USER, pw)
ftps.prot_p()

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
print(f"\nデプロイ完了: {len(files)} ファイル")
EOF

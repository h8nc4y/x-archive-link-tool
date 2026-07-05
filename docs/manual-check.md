# Manual Check

ローカルで安全に確認するための最小チェックリストです。

## 1. テスト

```powershell
npm test
```

PowerShellで `npm.ps1` の実行ポリシーエラーになる場合:

```powershell
npm.cmd test
```

`npm` が使えない場合:

```powershell
node --test
```

## 2. 起動

X API Bearer Tokenは任意です。未設定時はoEmbed fallbackで動作します。PowerShellの環境変数としてローカルポートだけ一時設定します。

```powershell
$env:PORT="3000"
npm start
```

PowerShellで `npm.ps1` の実行ポリシーエラーになる場合:

```powershell
$env:PORT="3000"
npm.cmd start
```

`npm` が使えない場合:

```powershell
$env:PORT="3000"
node server/extractServer.js
```

## 3. ブラウザ確認

- `http://127.0.0.1:3000/` が開く。
- `http://127.0.0.1:3000/healthz` が `{"ok":true}` を返す。
- Xポスト共有URLを入力して取得できる。
- 不正URLを入力するとエラーになり、魚拓リンクとコピー用テキストは無効になる（魚拓セクション自体は常時表示）。
- コピー用テキストが `textarea` に表示される。
- 魚拓リンクは4サービス併記（ウェブ魚拓(gyo.tc) / Wayback Machine / archive.today / Twitter魚拓(twtr.satoru.net)）で、それぞれ別タブで開く。
- ポスト取得前は4リンクとも無効（`aria-disabled="true"`）で、取得後に有効になる。
- 魚拓は自動取得されない（サーバーからは取得せず、外部リンクを開くだけ）。
- 魚拓URL欄は、併記した各サービスの結果URL（`megalodon.jp` 系 / `gyo.tc` / `web.archive.org` / `archive.today` 系ミラー / `twtr.satoru.net`）のみ有効になる。非httpsや許可外ホストは `未取得` になる。
- 魚拓URL欄に改行や空白を含む文字列を貼り付けた場合、コピー用テキストの魚拓URLは `未取得` になる。

## 4. 停止とポート競合

- サーバー停止は起動中のPowerShellで `Ctrl+C`。
- `EADDRINUSE` は同じポートで既にサーバーが起動中という意味。
- ポート3000の確認:

```powershell
Get-NetTCPConnection -LocalPort 3000
```

- 停止例:

```powershell
Stop-Process -Id <OwningProcess> -Force
```

- 別ポート起動例:

```powershell
$env:PORT="3001"
node server/extractServer.js
```

## 5. エラー確認

- token未設定でも起動できる。
- 不正URLを入力するとURL検証エラーになる。
- 削除済み、非公開、権限不足などの取得不能ポストではエラーになることがある。
- 短時間に連続実行すると `429` になることがある。

## 6. 実oEmbed確認

実oEmbed確認は任意です。実施する場合も、入力URL、postId、username、X本文、mediaUrlsをログやGitへ出さないでください。

PowerShellで `TEST_X_POST_URL` を一時的に設定済みの場合だけ、次の確認を実行します。値は表示しません。

確認用PowerShellで実行します。スクリプトは現在のローカルサーバー実装を一時ポートで起動し、1回だけ確認して終了します。

```powershell
$env:TEST_X_POST_URL="https://x.com/ユーザー名/status/ポストID"
node scripts/manualOEmbedCheck.js
```

このスクリプトはテストを実行しません。出力するのは環境変数の有無、HTTPステータス、JSONのトップレベルキー、エラー種別だけです。投稿URL、投稿本文、mediaUrls、username、user id、postIdは出力しません。

`npm` が使える場合:

```powershell
npm run manual:oembed-check
```

PowerShellで `npm.ps1` の実行ポリシーエラーになる場合は `npm.cmd run manual:oembed-check` を使います。

サーバー起動も含めてPowerShellだけで確認する場合:

```powershell
if (-not $env:TEST_X_POST_URL) {
  Write-Output "SKIP: TEST_X_POST_URL is not set."
} else {
  $env:PORT = "3010"
  $server = Start-Process -FilePath node -ArgumentList "server/extractServer.js" -WindowStyle Hidden -PassThru
  Start-Sleep -Seconds 1
  try {
    $body = @{ url = $env:TEST_X_POST_URL } | ConvertTo-Json -Compress
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "http://127.0.0.1:3010/api/extract" -ContentType "application/json" -Body $body
      $json = $response.Content | ConvertFrom-Json
      [pscustomobject]@{
        StatusCode = $response.StatusCode
        Keys = ($json.PSObject.Properties.Name -join ",")
      }
    } catch {
      [pscustomobject]@{
        StatusCode = [int]$_.Exception.Response.StatusCode
        Keys = ""
      }
    }
  } finally {
    Stop-Process -Id $server.Id -Force
  }
}
```

この確認では、投稿URL、投稿本文、mediaUrls、username、user idを出力しないでください。

## 7. 確認済みのoEmbed版仕様

- X_BEARER_TOKENは任意。未設定時はoEmbed fallback。
- userNumericId は `未取得`。
- mediaUrls は直接取得しないため空配列。Web UIでは `なし`。
- 魚拓リンクは表示するが、魚拓は自動取得しない。

## 8. 禁止事項

- `.env` をコミットしない。
- 投稿本文やメディアURLをログに出さない。
- X API v2を使わない。
- X HTMLスクレイピングをしない。
- 魚拓を自動取得しない。

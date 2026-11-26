# 鎬ц兘鍩虹嚎锛?026-11-12锛?
鐜锛歐indows銆丏SH 鏈満 API銆? 涓?Bot銆?5 涓嚎绋嬨€乻tate.json 绾?1.18 MB銆?
## 鍩虹嚎

`node scripts/bench-api.mjs`锛? 娆￠噰鏍凤紝p50锛夛細

| 鎺ュ彛 | p50 | 澶囨敞 |
|---|---:|---|
| `/state` | 5 ms | 117 KB payload |
| `/bootstrap` | 4 ms | 117 KB payload |
| `/health` | 1 ms | |
| `/team` | 3 ms | |
| `/memory` | **215 ms** | 姣忔璋冪敤閮借窇 `git rev-parse`銆乣git log`銆乣git status` |
| `/notify` | 1 ms | |

## 淇

`/memory` 鐨?Git 鍘嗗彶缁撴灉鍔犲叆 5 绉?TTL 缂撳瓨锛?
- 缂撳瓨 key锛欱ot 鐨勮蹇嗕粨搴撶洰褰曪紱
- 淇濆瓨銆佹彁浜ゃ€佹仮澶嶈蹇嗘椂涓诲姩澶辨晥锛?- 涓嶆敼鍙?API 杩斿洖缁撴瀯锛屼笉鏀瑰彉鏂囦欢鍐呭銆?
淇鍚庯細

| 鎺ュ彛 | p50 | 鍐峰惎鍔?|
|---|---:|---:|
| `/memory` | **2 ms** | 绾?205鈥?15 ms |

涔熷氨鏄噸澶嶆墦寮€璁板繂闈㈡澘浠庣害 215 ms 闄嶅埌绾?2 ms锛屽喎鍚姩鎴愭湰淇濈暀浣嗗彧浠樹竴娆°€?
## 鐘舵€佸揩鐓х槮韬?
`/state` 鐨?`quality.recent` 涔嬪墠甯?16 鏉″畬鏁?run锛堟瘡鏉″寘鍚畬鏁?prompt銆乻ummary銆乪rrors 绛夛級锛屽崟 `quality` 瀛楁绾?**57.2 KB**锛屾暣涓?`/state` 绾?**117 KB**銆?
UI 瀹為檯鍙覆鏌撴渶杩?5 鏉★紝骞跺彧浣跨敤 id/status/prompt/steps/verification/鏃堕棿銆?
鏀逛负涓撶敤 `publicQualityRun()`锛?
- 鏈€杩?5 鏉★紱
- prompt 鎴柇 160锛?- verification 鍙甫 status/note锛?- 鍏ㄩ噺 run 浠嶄繚鐣欏湪 `state.json`锛屽彧鏄笉浠庡揩鐓т笅鍙戙€?
缁撴灉锛?
| 椤圭洰 | 涔嬪墠 | 涔嬪悗 |
|---|---:|---:|
| `quality` | 57.2 KB | **3.6 KB** |
| `/state` | 117 KB | **62 KB** |
| `/bootstrap` | 117 KB | **62 KB** |

`/state` p50 浠嶇害 5 ms锛屼絾瀹㈡埛绔В鏋愬拰娓叉煋鐨勬暟鎹噺鍑忓皯绾?47%銆?
## 娲炬椿鍒楄〃鐦﹁韩

`/team` 涔嬪墠绾?**95 KB**锛屼富瑕佹潵鑷瘡鏉?assignment 鐨勫畬鏁?prompt/summary/error锛堝崟鏉℃渶澶?4 KB锛夈€?
UI 瀹為檯鍙樉绀?summary 120 瀛椼€佺姸鎬併€佹鏁般€佽€楁椂鍜?tokens銆?
璋冩暣涓猴細

- prompt 600 瀛楋紱
- summary 800 瀛楋紱
- error 500 瀛椼€?
缁撴灉锛?
```text
/team锛?5 KB 鈫?40 KB
```

瀹屾暣璁板綍浠嶄繚鐣欏湪 `state.json`锛屽彧鏄垪琛ㄦ帴鍙ｄ笉鍐嶄笅鍙戝ぇ娈垫鏂囥€?
## 瀹夊叏蹇収鐦﹁韩

`/state.safety` 涔嬪墠甯?8 鏉″畬鏁?snapshot 鍜?8 鏉?audit锛岀害 **12.3 KB**锛沀I 鍙樉绀烘渶杩?3 鏉?snapshot锛屼笖鍙渶瑕?id/kind/reason/status/entries 鏁伴噺銆?
鏀逛负锛?
- 鏈€杩?3 鏉★紱
- audit 鏄庣粏涓嶅啀闅忓揩鐓т笅鍙戯紙浠嶄繚鐣?`auditCount`锛夛紱
- snapshot 鍙甫 UI 浣跨敤鐨勫瓧娈靛拰 `entriesCount`銆?
缁撴灉锛?
```text
safety锛?2.3 KB 鈫?0.9 KB
/state锛?2 KB 鈫?51 KB
/team锛?5 KB 鈫?40 KB锛堜笂涓€杞級
```

## 瀹㈡埛绔疆璇?
涔嬪墠鍓嶇鍥哄畾姣?**900 ms** 鎷変竴娆?`/state`锛屽嵆浣夸换鍔＄┖闂层€侀〉闈㈤潤缃€?
鐜板湪鑷€傚簲锛?
- 杩愯涓?/ 鏈?stream / 鏈?approval / 鏈?question锛?00 ms锛?- 绌洪棽锛?000 ms锛?- 椤甸潰闅愯棌锛氫笉杞锛屾仮澶嶅彲瑙佹椂绔嬪嵆琛ヤ竴娆°€?
绌洪棽鐘舵€佽姹傞鐜囦粠绾?67 娆?鍒嗛挓闄嶅埌绾?20 娆?鍒嗛挓锛岄暱浼氳瘽闈欑疆鏃?CPU 鍜?API 鍘嬪姏鏇翠綆銆?
## 璇剧▼ UIA 鍐峰惎鍔?
涔嬪墠姣忔 `course.py` 璇诲彇閮藉惎鍔ㄤ竴娆?Windows PowerShell + UIAutomation锛屽喎鍚姩绾?**2.3 s**銆?
鏂板 Python UIA 蹇矾寰勶細

- `uia_fast.py` 鐢?Python COM 鐩存帴璇?Document/TextPattern锛?- `uia_service.py` 鏄?loopback-only 鐨勫父椹绘湇鍔★紙闅忔満 token锛岀┖闂?5 鍒嗛挓閫€鍑猴級锛?- `uia_client.py` 鎸夐渶鍚姩骞跺鐢ㄦ湇鍔★紱
- 鏈嶅姟澶辫触鏃惰嚜鍔ㄥ洖閫€鍒?`edge.py`锛屼笉鏀瑰彉璇剧▼琛屼负锛?- `next` / `ppt` 鐨勭偣鍑讳篃浼樺厛璧板揩璺緞骞舵瘮杈冩枃鏈彉鍖栥€?
瀹炴祴鏈満 Course Progress 椤甸潰锛?
```text
鏃?edge.py 璇诲彇锛氱害 2300 ms
鏂板揩璺緞鍐峰惎鍔細绾?1200鈥?500 ms
鏂板揩璺緞缂撳瓨鍛戒腑锛氱害 150鈥?00 ms
```

## 闀夸細璇濇覆鏌?
娑堟伅琛?`.gb-user` / `.gb-assistant` 浣跨敤锛?
```css
content-visibility: auto;
contain-intrinsic-size: auto 120px/160px;
```

娴忚鍣ㄨ烦杩囪鍙ｅ娑堟伅鐨勫竷灞€鍜岀粯鍒讹紝婊氬姩鍒伴檮杩戞椂鍐嶆覆鏌擄紱娌℃湁鏀规秷鎭唴瀹规垨浜や簰銆?
## 澶嶇幇

```powershell
$env:DSH_HOME='C:\Users\<you>\.dsh'
node scripts/bench-api.mjs
```

鍙€夛細

```powershell
$env:DSH_BOT_BENCH_SAMPLES='20'
$env:DSH_BOT_RUNTIME='D:\path\to\runtime.json'
```

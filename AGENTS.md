# AGENTS.md

鏈粨搴撶殑闀挎湡椤圭洰钃濆浘銆佽竟鐣屻€佹灦鏋勬剰鍥句笌闃舵璺嚎瑙佹牴鐩綍 `mirror.md`銆? 
鏈枃浠跺彧淇濈暀 Codex 鎵ц鏃堕渶瑕佷紭鍏堥伒瀹堢殑鐭鍒欏拰鍛戒护鍏ュ彛銆? 
濡傛棤鏄庣‘渚嬪锛屾墍鏈夊疄鐜板簲涓?`mirror.md` 淇濇寔涓€鑷淬€?
## Intent

Mirror 鏄彈闄愬煙銆佸彲杩芥函銆佽瘉鎹害鏉熺殑鏉′欢鍖栨帹婕旀矙鐩樸€?
## Non-goals

- 涓嶅仛鐪熷疄涓栫晫棰勬祴鏈哄櫒
- 涓嶅仛鐪熷疄浜虹墿鐢诲儚鎴栨暟瀛楁浛韬?- 涓嶅仛鏀挎不鎿嶆帶銆佹墽娉曢娴嬨€佹嫑鑱?淇¤捶/鍖荤枟/鍙告硶涓綋鍖栬瘎鍒?- 涓嶆妸妯℃嫙缁撴灉鍖呰鎴愮幇瀹炵粨璁?
## Repo Map

- `mirror.md`: 椤跺眰钃濆浘涓庨暱鏈熺害鏉?- `README.md`: 瀵瑰绠€浠嬨€佸揩閫熷紑濮嬨€佸懡浠ゅ叆鍙?- `docs/plans/`: 鍏蜂綋浠诲姟璁″垝
- `docs/decisions/`: ADR / 鍐崇瓥璁板綍
- `.agents/skills/`: 绐勮亴璐?Codex workflows
- `data/demo/`: demo corpus銆乻cenarios銆乪xpectations
- `backend/`: FastAPI銆丳ydantic銆丆LI銆乸ipeline
- `evals/`: assertions銆乨ataset銆佽剼鏈?- `artifacts/`: 杩愯浜х墿锛岄粯璁や笉鍏ュ簱

## Commands

Canonical target names:

- `make setup`
- `make smoke`
- `make test`
- `make eval-demo`
- `make dev-api`
- `make dev-web`

Windows/PowerShell 鍏煎鍏ュ彛锛?
- `./make.ps1 setup`
- `./make.ps1 smoke`
- `./make.ps1 test`
- `./make.ps1 eval-demo`

## Working Rules

- 瑙﹀強瓒呰繃 3 涓枃浠跺墠锛屽厛缁欑畝鐭鍒掋€?- 瑙﹀強 schema銆乻cenario DSL銆乧laim label銆乺un trace銆乤rtifacts tree 鍓嶏紝鍏堟敹鍙ｅ绾︺€?- 鏀规牳蹇冨绾︽椂锛屽悓姝ユ洿鏂?`docs/architecture/contracts.md`锛屽繀瑕佹椂鏂板 `docs/decisions/` 璁板綍銆?- 姣忎釜浠诲姟閮借甯︽渶灏忓懡浠ゆ垨娴嬭瘯銆?- 姣忎釜鏂板 report claim 閮藉繀椤讳繚鐣?`label` 涓?`evidence_ids`銆?- 鎵€鏈変笉纭畾椤规樉寮忓啓鎴?`TODO[verify]: ...`锛屼笉鍏佽缂栭€犮€?
## Subagent Rules
- 子代理默认采用最新最强模型（如 \gpt-5.4\，配合 \xhigh\ 级推理强度），仅在明确追求速度、成本或其他性能需求时，才可降级到更轻量模型（如 \gpt-5.4-mini\、\gpt-5.2-codex\）。

- 瀛愪唬鐞嗕笉鏄粯璁ゆ洿寮猴紝榛樿妯″紡鏄€滀富浠ｇ悊 + 鍙渚﹀療 + 鍗曞啓鎵嬧€濄€?- 浠呭綋浠诲姟鑷冲皯婊¤冻涓嬪垪 2 鏉℃椂锛屾墠寤鸿 spawn 瀛愪唬鐞嗭細
  - 鍙媶鎴?2 涓互涓婄浉瀵圭嫭绔嬬殑瀛愰棶棰?  - 瀛愰棶棰樹箣闂翠富瑕佹槸淇℃伅姹囨€诲叧绯伙紝涓嶆槸鎸佺画鍏卞悓鍐欎綔
  - 姣忎釜瀛愰棶棰橀兘鑳藉畾涔夋竻鏅拌緭鍑烘牸寮?- 瀛愪唬鐞嗕紭鍏堢敤浜庯細浠撳簱鎽稿簳銆佹枃妗?瑙勮寖鏍搁獙銆佹祴璇曠己鍙ｆ壂鎻忋€乪val 褰掑洜銆乁I/bug 澶嶇幇鍙栬瘉銆佸畨鍏ㄧ孩绾垮鏌ャ€?- 瀛愪唬鐞嗕笉閫傚悎锛歚mirror.md` 绾ц摑鍥句慨鏀广€佹牳蹇?schema/graph/scenario DSL/simulation contract 鏀瑰啓銆佸叧閿皟搴﹂€昏緫骞惰鏀瑰啓銆侀渶瑕佸涓?writer 鍚屾椂纰板悓涓€鏍稿績鏂囦欢鎴栨牳蹇?contract 鐨勪换鍔°€?- 娑夊強鏍稿績鏋舵瀯銆佸绾︽敹鍙ｃ€佹槸鍚︽敼 `mirror.md`銆佹槸鍚︽敼 `docs/architecture/contracts.md`銆佹槸鍚︽柊澧?ADR銆佹渶缁堟柟妗堥€夋嫨锛屽繀椤荤敱涓讳唬鐞嗗崟绾跨▼鎷嶆澘銆?- `repo_explorer`銆乣docs_researcher`銆乣safety_reviewer` 蹇呴』鍙锛沗evaluator` 鍙厑璁歌窇楠岃瘉鍛戒护鍜屾鏌?artifacts锛屼笉鏀?tracked files锛沗implementer` 鏄敮涓€寤鸿鍙啓瑙掕壊銆?- 榛樿鍙紑 1-2 涓彧璇诲瓙浠ｇ悊鍋氭悳璇佹垨鏍搁獙锛泈riter 蹇呴』鍦ㄤ富浠ｇ悊瀹屾垚姹囨€诲悗鍐嶅嚭鎵嬶紝涓嶄笌鍙︿竴涓?writer 骞惰鏀瑰悓涓€鐗囦唬鐮併€?- 涓讳唬鐞嗗湪 spawn 鍓嶅繀椤诲厛鍐欐竻瀛愪换鍔¤竟鐣屻€佺洰鏍囨枃浠舵垨鐩爣璇佹嵁闈紝涓嶅厑璁告ā绯婂鎵樸€?- 姣忎釜瀛愪唬鐞嗚繑鍥炲繀椤诲敖閲忎娇鐢ㄧ粺涓€缁撴瀯锛?  - `summary`
  - `evidence`
  - `risks`
  - `recommended_action`
  - `needs_decision`
- `evidence` 搴斾紭鍏堝寘鍚枃浠惰矾寰勩€佺鍙峰悕銆佸懡浠ゃ€乤rtifact 璺緞鎴栨枃妗ｄ綅缃紱涓嶇‘瀹氶」缁х画鍐欐垚 `TODO[verify]: ...`銆?- 閲嶅鎬ч珮銆佽竟鐣岀ǔ瀹氱殑娴佺▼锛屼紭鍏堟矇娣€涓?`.agents/skills/`锛屼笉瑕佹瘡娆′复鏃?prompt 涓€涓€滃ぇ鑰屽叏鈥濆瓙浠ｇ悊銆?- 鏇撮暱鐢熷懡鍛ㄦ湡鐨勫苟琛屽紑鍙戜紭鍏堢敤 thread / worktree 鎷嗗垎锛屼笉鐢ㄩ€掑綊 delegation锛涢」鐩骇 subagent 瑙勫垯瑙?`docs/subagents.md` 涓?`.codex/`.

## Safety And Licensing

- 鍙?ingest 鏄庣‘鍏佽鐨勬暟鎹€?- `data/demo/` 涓€寰嬩负鍘熷垱銆佽櫄鏋勩€佸彲鍏紑灞曠ず鍐呭銆?- 榛樿鎷︽埅鐪熷疄浜虹墿 persona銆佹斂娌昏鏈嶃€佹墽娉?鎷涜仒/淇¤捶/鍖荤枟/鍙告硶棰勬祴銆侀殣钄界洃鎺с€?- 鍙傝€冨紑婧愰」鐩椂瀛?workflow锛屼笉鐩存帴鎼唬鐮侊紱鑻ユ湭鏉ュ紩鍏?AGPL 渚濊禆锛屽繀椤诲厛鍐欏喅绛栬褰曘€?
## Definition Of Done

- 鏈夊疄鐜?- 鏈夋渶灏忔祴璇曟垨 smoke 鍛戒护
- 鏈夊彲瑙傚療杈撳嚭鎴?artifacts
- 鏂囨。/濂戠害宸插悓姝?- 鏈牬鍧?claim / evidence 閾?- 鏈紩鍏ユ湭璁板綍鐨勯珮椋庨櫓杈圭晫


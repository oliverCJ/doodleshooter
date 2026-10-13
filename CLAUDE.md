# doodleshooter 项目说明


## 项目职责

本项目是一个前端静态运行的涂鸦风射击游戏，核心代码位于 `src/`。推荐通过 Node 本地服务启动，以同时提供静态资源和离线局域网联机信令；`serve.py` 保留为轻量静态备用服务。

## 当前核心模块边界

- `src/main.js`：负责游戏启动、菜单、模式生命周期、PVP 对战生命周期和主循环协调；在线对战菜单使用公网/局域网 Tab，两个模式的公开大厅列表状态必须隔离。
- `src/i18n.js`：负责用户可见文案的中英文语言包、语言持久化和参数插值。
- `src/loadout.js`：负责武器配置规则，当前规则是 4 个武器槽位中必须包含主武器和近战武器。
- `src/throwables.js`、`src/throwableLoadout.js` 与 `src/throwableManager.js`：负责投掷物注册、开始前携带数量规则和运行时投掷物数量/活动实体边界；当前只注册手雷，总携带上限为 5。
- `src/grapple.js`：负责钩爪规则，当前最大可挂距离为 100，HUD 提示和实际发射必须共用该规则。
- `src/gameplay/waves.js`：负责单人生存波次的纯规则，包括敌人解锁、权重、修饰器、Boss 轮换、敌人队列、检查点和提示 key；不访问 HUD、音频、Three.js、Net 或浏览器运行时。
- `src/gameplay/pvpCombatRules.js`：负责 PVP 命中、防御、死亡 payload、死亡计分、坠落惩罚、比分排序和胜者判断的纯规则；不访问 Three.js、HUD、Net、Player、RemotePlayer、i18n 或浏览器运行时。
- `src/screens/mainMenu.js`：负责主菜单侧边书签 Tab 和开始/设置/操作说明页渲染。
- `src/screens/onlineMenu.js`：负责在线页、大厅页、大厅列表的渲染和 DOM 事件绑定；通过 `state/actions` 依赖注入，不直接依赖 `Net`、Three.js 或浏览器运行时单例。
- `src/online/lobbyActions.js`：负责在线大厅业务动作和在线菜单 state/actions 适配，包括创建、加入、快速匹配、刷新大厅列表、LAN/公网模式切换、LAN 信令检测和错误转换；不负责 PVP 战斗同步、主机迁移、`net.on(...)` 或 `leaveOnline()` 的生命周期清理。
- `src/version.js`：负责浏览器运行时版本常量，`APP_VERSION` 必须与 `package.json` version 一致，`SIGNALING_VERSION` 取 major.minor 用于联机兼容隔离。
- `src/mapConfig.js` 与 `src/levels/`：负责地图配置、固定地图注册和具体固定地图构建。
- `src/training.js`：负责训练场靶子实体、移动、命中、扣血、倒下和刷新，不接入 `EnemyManager`。
- `src/trainingRules.js`：负责训练靶纯规则，包括圆靶环数、假人部位和移动路径偏移。
- `src/weapons.js`：负责武器表现和命中流程；训练模式下通过 `ctx.training` 命中训练靶。
- `src/hud.js`：负责 HUD 展示，包括训练靶名称和血量显示。
- `src/networkConfig.js`：负责公网信令开关、局域网信令检测和 PeerJS options/prefix 生成。
- `scripts/build-static.mjs`：负责生成公网静态部署产物 `dist/`，只复制浏览器运行必需的 `index.html`、`style.css`、`src/` 和 `vendor/`。
- `wrangler.jsonc` 与 `.github/workflows/deploy-cloudflare.yml`：负责 Cloudflare Workers Static Assets 静态部署配置和手动触发部署流程，不提供游戏服务器、PeerJS 信令或 `/lan-health`。
- `server/lan-server.js`：推荐本地游戏服务，负责静态资源和本地 PeerServer 信令，支持离线局域网联机；对外提供 `/peerjs`，ExpressPeerServer 内部 path 保持 `/`，避免 PeerJS 路径重复叠加；收到 SIGINT/SIGTERM 时必须主动关闭浏览器和 PeerJS 长连接，不能等待客户端正常退出。
- `Dockerfile` 与 `docker-compose.yml`：使用 Node 服务镜像运行 `npm run serve`，对外暴露 `8910:8910`，能力应与本机推荐启动方式一致，包括静态资源、`/lan-health` 和 `/peerjs`。
- `serve.py`：负责本机和局域网静态资源服务，支持 `--lan`、`--host`、`--port`，用于普通浏览器访问和局域网页面加载验证。
- `.codex/skills/training-map-validation/`：训练场地图专项校验 skill，修改训练场地图后用于检查靶点、悬浮物、门洞、假人数量、建筑隔墙、钩爪平台支撑和楼梯连接等结构问题。

## 维护约束

- 训练场是独立入口和独立模式，`game.mode = 'training'`。
- 训练场不启动普通生存波次，不生成普通敌人。
- 训练靶不进入 `EnemyManager`，不参与敌人 AI、掉落、波次和联机镜像。
- 训练分数只用于当前训练场，不写入生存最高分。
- 固定地图新增应优先通过 `src/levels/registry.js` 注册，并将地图构建逻辑放在 `src/levels/` 下。
- 新增或修改用户可见文字必须走 `src/i18n.js`，至少提供中文和英文，不得在交互 UI 中直接写死单语言文本。
- 修改主菜单布局、语言切换、钩爪规则或投掷物携带规则后，运行对应的 `test/i18n.test.mjs`、`test/main-menu-layout.test.mjs`、`test/grapple.test.mjs`、`test/throwable-loadout.test.mjs` 和 `test/throwable-manager.test.mjs`。
- 修改单人生存波次规则后，运行 `node test/waves.test.mjs`、`node test/grenade-loadout-start.test.mjs`、`node --check src/gameplay/waves.js` 和 `node --check src/main.js`。
- 修改 PVP 战斗规则后，运行 `node test/pvp-combat-rules.test.mjs`、`node test/online-ui-state.test.mjs`、`node test/net-lan-public-discovery.test.mjs`、`node --check src/gameplay/pvpCombatRules.js` 和 `node --check src/main.js`；不得改变 `pdmg`、`pdead`、`parry`、`score`、`fell`、`feed` 网络 payload 结构。
- 新增或修改训练场地图后，运行 `python3 .codex/skills/training-map-validation/scripts/validate_doodleshooter_training_map.py .` 做训练场地图结构校验。
- 修改 Node 本地服务或局域网信令后，运行 `npm run check:lan-server` 验证静态资源和本地信令健康检查。
- 修改 Docker 启动方式后，运行 `node test/docker-lan-config.test.mjs` 验证镜像入口和端口暴露仍支持局域网 `/peerjs` 信令。
- 修改在线对战公网/局域网 Tab、公开大厅列表或按钮恢复逻辑后，运行 `node --experimental-default-type=module test/online-ui-state.test.mjs` 和 `node --experimental-default-type=module test/net-lan-public-discovery.test.mjs`。
- 修改在线大厅 UI 模块后，运行 `node test/online-menu.test.mjs`、`node --check src/screens/onlineMenu.js` 和 `node --check src/main.js`；网络协议、payload、大厅数据结构不得因 UI 拆分改变。
- 修改在线大厅业务动作后，运行 `node test/lobby-actions.test.mjs`、`node test/online-menu.test.mjs`、`node test/online-ui-state.test.mjs`、`node test/net-lan-public-discovery.test.mjs`、`node --check src/online/lobbyActions.js` 和 `node --check src/main.js`。
- 修改联机 payload、大厅数据结构、PVP 规则公平性、地图/武器/投掷物联机展示兼容性时，必须评估是否升级 `package.json` 的 minor 版本；patch 版本不得改变 `SIGNALING_VERSION`。
- 修改版本或信令前缀后，运行 `node test/version.test.mjs`、`node test/net-version-compat.test.mjs`、`node test/net-lan-public-discovery.test.mjs`、`node test/lobby-actions.test.mjs`、`node --check src/version.js`、`node --check src/networkConfig.js` 和 `node --check src/net.js`。
- 修改公网部署、构建产物或 Cloudflare 配置后，运行 `node test/build-static.test.mjs`、`node test/cloudflare-config.test.mjs`、`node test/deploy-workflow.test.mjs`、`npm run build`、`node --check scripts/build-static.mjs` 和 `git diff --check`。
- 公网静态部署只能发布 `dist/`，不得直接发布整个仓库目录；公网部署不提供离线局域网信令，LAN 功能必须依赖本地 `npm run serve` 或 Docker 服务提供 `/peerjs` 和 `/lan-health`。
- LAN 联机必须保持浏览器 WebRTC P2P，不得改为本地 relay；公网开关开启时可以给 LAN PeerJS options 提供 STUN 辅助，关闭时必须保持 `iceServers: []`。
- 排查 LAN 联机失败时，优先基于 `Net` 的 `diagnostic`、`iceStateChanged` 和 `connectionError` 事件临时增加诊断输出，不得在没有连接阶段证据时直接更换信令或传输架构；常规发布版本不得向浏览器控制台输出网络调试日志。
- 修改 `serve.py` 或静态资源加载策略后，运行 `python3 test/static-server-health.py` 验证关键资源并发访问。

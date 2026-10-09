# doodleshooter 项目说明

## 项目职责

本项目是一个前端静态运行的涂鸦风射击游戏，核心代码位于 `src/`，通过 `serve.py` 提供本地静态服务。

## 当前核心模块边界

- `src/main.js`：负责游戏启动、菜单、模式生命周期、单人生存波次、联机大厅和主循环协调。
- `src/loadout.js`：负责武器配置规则，当前规则是 4 个武器槽位中必须包含主武器和近战武器。
- `src/mapConfig.js` 与 `src/levels/`：负责地图配置、固定地图注册和具体固定地图构建。
- `src/training.js`：负责训练场靶子实体、移动、命中、扣血、倒下和刷新，不接入 `EnemyManager`。
- `src/trainingRules.js`：负责训练靶纯规则，包括圆靶环数、假人部位和移动路径偏移。
- `src/weapons.js`：负责武器表现和命中流程；训练模式下通过 `ctx.training` 命中训练靶。
- `src/hud.js`：负责 HUD 展示，包括训练靶名称和血量显示。
- `.codex/skills/training-map-validation/`：训练场地图专项校验 skill，修改训练场地图后用于检查靶点、悬浮物、门洞、假人数量、建筑隔墙、钩爪平台支撑和楼梯连接等结构问题。

## 维护约束

- 训练场是独立入口和独立模式，`game.mode = 'training'`。
- 训练场不启动普通生存波次，不生成普通敌人。
- 训练靶不进入 `EnemyManager`，不参与敌人 AI、掉落、波次和联机镜像。
- 训练分数只用于当前训练场，不写入生存最高分。
- 固定地图新增应优先通过 `src/levels/registry.js` 注册，并将地图构建逻辑放在 `src/levels/` 下。
- 新增或修改训练场地图后，运行 `python3 .codex/skills/training-map-validation/scripts/validate_doodleshooter_training_map.py .` 做训练场地图结构校验。

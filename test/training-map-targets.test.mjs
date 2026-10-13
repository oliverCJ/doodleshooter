import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/levels/training.js', import.meta.url), 'utf8');
const trainingSource = fs.readFileSync(new URL('../src/training.js', import.meta.url), 'utf8');
const match = source.match(/L\.trainingTargets\s*=\s*(\[[\s\S]*?\n\s*\]);/);
assert.ok(match, '训练场应声明训练靶');

const targets = Function('Math', `return ${match[1]};`)(Math);
assert.ok(targets.length > 0, '训练场应声明训练靶');

function assertTargetFaceNotInsideBackdrop(target) {
  if (target.type !== 'ring' && target.type !== 'moving-ring') return;
  const [x, y, z] = target.pos;
  const leftRangeBackdrop = [-34, -25, -17].includes(x) && [-24, -8, 8, 24].includes(z) && y < 4;
  assert.equal(leftRangeBackdrop, false, `${target.name} 靶面不能插入靶道墙体或箱体`);
}

for (const target of targets) assertTargetFaceNotInsideBackdrop(target);

for (const target of targets.filter((item) => item.type === 'moving-ring')) {
  assert.ok(target.pos[1] <= 3, `${target.name} 不应配置成高空悬浮靶`);
}

assert.equal(/SphereGeometry/.test(source), false, '训练场不应保留无功能悬浮球装饰');
assert.equal(/\bsphere\(/.test(source), false, '训练场不应保留无功能悬浮球装饰');

const ringTargets = targets.filter((item) => item.type === 'ring' || item.type === 'moving-ring');
assert.ok(ringTargets.length >= 1, '训练场应包含圆靶');
for (const target of ringTargets) assert.equal(target.doubleSided, true, `${target.name} 应显式配置为双面靶环`);
assert.match(trainingSource, /const RING_FACE_OFFSET\s*=\s*0\.08/, '双面圆靶前后靶面应有明确间距，避免深度排序导致看起来仍是单面');
assert.match(trainingSource, /for \(const side of \[1, -1\]\)/, '圆靶应生成前后两套靶环');

assert.ok(targets.filter((item) => item.type === 'dummy').length >= 5, '建筑训练区至少需要 5 个假人靶');
assert.equal(targets.some((item) => item.type === 'dummy' && item.pos[0] >= -7 && item.pos[0] <= 2 && item.pos[2] >= 11.9 && item.pos[2] <= 14.1), false, '假人靶不应放在中央建筑正面楼梯投影内');
assert.equal(targets.some((item) => item.type === 'dummy' && item.pos[0] > 12.8 && item.pos[2] > -12 && item.pos[2] < 12), false, '假人靶不应挂在中央建筑右侧外墙外');

assert.match(trainingSource, /const RESPAWN_DELAY\s*=\s*2/, '训练靶刷新延迟应为 2 秒');
assert.match(trainingSource, /target\.group\.visible\s*=\s*false/, '靶子血量归零后应整组隐藏');
assert.doesNotMatch(trainingSource, /rotation\.z\s*=\s*Math\.min/, '靶子不应再用支撑脚旋转模拟倒下');

assert.match(source, /wallX\(-9, 13, -12, 0, 8, 0\.4, \[\[-6, -3, 0, 3\.2\]/, '建筑前墙应有可进入门洞');
assert.match(source, /wallX\(-9, 13, 12, 0, 8, 0\.4, \[\[-7, -3, 0, 3\.2\]/, '建筑后墙应有可离开门洞');
assert.match(source, /\[1, 5, 4, 7\.2\]/, '建筑二层楼梯出口应有门洞');
assert.match(source, /\[2, 6, 4, 7\.2\]/, '建筑屋顶楼梯出口应有门洞');
assert.match(source, /slab\(-9, -12, 13, 12, 4, 0\.4\)/, '一层到二层使用室外楼梯时，二层地板应保持完整');
assert.doesNotMatch(source, /slab\(-9, -12, 13, 12, 8, 0\.4\)/, '屋顶地板不应是无楼梯口的整块 slab');
assert.match(source, /floorWithOpening\(-9, -12, 13, 12, 8, 0\.4, \[1\.5, -9\.4, 11\.5, -6\.6\]\)/, '屋顶地板应为二层到三层楼梯预留开口');
assert.match(source, /box\(1\.5, 7\.6, -8, 3, 0\.4, 2\.8, \{ ink: INK\.ORANGE \}\)/, '二层到三层楼梯顶部应有加宽 landing 与屋顶地板闭合');
assert.doesNotMatch(source, /stairs\(-7, 0, (0|1[34]), '\+x'/, '中央建筑一层到二层楼梯不应放在室内或占用后墙门洞');
assert.match(source, /wallZ\(-12, 12, 13, 0, 8, 0\.4, \[\[-8, -4, 4\.8, 6\.6\], \[1, 5, 4\.8, 6\.6\], \[6, 10, 4, 7\.2\]\]\)/, '中央建筑右侧墙应有二层室外楼梯入口');
assert.match(source, /slab\(13, 6, 17, 10, 4, 0\.4/, '一层到二层室外楼梯应接入带支撑的二层 landing');
assert.match(source, /box\(16, 0, 7, 0\.5, 4, 0\.5/, '一层到二层室外 landing 应有落地支撑 A');
assert.match(source, /box\(16, 0, 9, 0\.5, 4, 0\.5/, '一层到二层室外 landing 应有落地支撑 B');
assert.doesNotMatch(source, /stairs\(24, 0, 8, '-x'/, '一层到二层室外楼梯不应横向侵占右侧训练空间');
assert.match(source, /stairs\(15, 0, -3, '\+z', 18, 2\.2, \{ rise: 4 \/ 18, run: 0\.5 \}\)/, '一层到二层室外楼梯应贴着建筑右侧墙纵向布置');
assert.doesNotMatch(source, /stairs\(11, 4, -14, '-x'/, '中央建筑二层到屋顶楼梯不应从建筑外侧悬空起步');
assert.match(source, /stairs\(11, 4, -8, '-x', 18, 2\.2, \{ rise: 4 \/ 18, run: 0\.5 \}\)/, '中央建筑二层到屋顶楼梯应放在二层地板范围内');
assert.match(source, /wallZ\(-10, 10, 2, 0, 4, 0\.35, \[\[-2, 2, 0, 3\.2\]\]/, '中央建筑一层应有带门洞的内部隔墙');
assert.match(source, /slab\(2, 18, 14, 30, 4, 0\.4/, '中央建筑背后应有钩爪练习平台');
for (const [x, z] of [[3, 19], [13, 19], [3, 29], [13, 29]]) {
  const supportPattern = new RegExp(`box\\(${x}, 0, ${z}, 0\\.5, 4, 0\\.5`);
  assert.match(source, supportPattern, `钩爪平台支撑柱应落地: ${x},${z}`);
}
assert.doesNotMatch(source, /stairs\(10, 0, 9, '\+z'/, '钩爪平台楼梯不应从中央建筑后墙方向进入');
assert.match(source, /slab\(14, 22, 17, 26, 4, 0\.4/, '钩爪平台侧边应有连接楼梯的落地支撑平台');
assert.match(source, /box\(16, 0, 23, 0\.5, 4, 0\.5/, '钩爪平台侧边连接平台应有落地支撑柱 A');
assert.match(source, /box\(16, 0, 25, 0\.5, 4, 0\.5/, '钩爪平台侧边连接平台应有落地支撑柱 B');
assert.match(source, /stairs\(25, 0, 24, '-x', 18, 2\.2, \{ rise: 4 \/ 18, run: 0\.5 \}\)/, '钩爪平台楼梯应从建筑外侧接入侧边平台，避开中央建筑后墙');
assert.match(source, /rail\(2, 18, 14, 18, 4\)/, '钩爪平台前沿可以使用整段栏杆，入口应改到建筑外侧');
assert.match(source, /ring\(8, 7, 24, 'y'\)/, '钩爪练习环应位于受支撑平台上方的训练路径中');

assert.doesNotMatch(source, /for \(const \[x, y, z, w, d\] of \[\[24, 1\.8, -26/, '移动靶区域上方不应保留悬浮跳台建筑');
assert.doesNotMatch(source, /ring\(x, y \+ 4, z, 'y'\)/, '移动靶区域上方不应保留悬浮抓钩环');

/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   CONTENT — hotspots, events, science cards
   ========================================================= */
const HS = {
  desk: { x: 3, z: 4.75, name: '办公桌', code: '503' },
  sofa: { x: 2.3, z: 8, name: '沙发', code: '503' },
  bay: { x: 10.6, z: 5.4, name: '小陈的座位', code: '505' },
  bay3: { x: 13.8, z: 5.4, name: '小周的座位', code: '505' },
  bay2: { x: 17.0, z: 9.4, name: '小雨的座位', code: '505' },
  detector: { x: 26, z: 6.3, name: '缪子望远镜', code: '507' },
  labdoor: { x: 26, z: 12.4, name: '实验室门口', code: '507' },
  rack: { x: 36, z: 8.4, name: 'GPU 集群', code: '509' },
  podium: { x: 6, z: 22.3, name: '讲台', code: '502' },
  meeting: { x: 16, z: 18.4, name: '会议室', code: '504' },
  admin: { x: 23, z: 19.7, name: '院办', code: '506' },
  coffee: { x: 27.6, z: 23.9, name: '咖啡机', code: '508' },
  food: { x: 30.2, z: 23.9, name: '微波炉', code: '508' },
  wc: { x: 34, z: 20.5, name: '洗手间', code: 'WC' },
  elevator: { x: 38.2, z: 18.6, name: '电梯', code: 'EV' },
  scope: { x: 22, z: 10.0, name: '示波器工位', code: '507' },
  optics: { x: 29.6, z: 4.1, name: '光学平台', code: '507' },
  notice: { x: 24.4, z: 12.3, name: '走廊公告板', code: 'HALL' },
  bay4: { x: 17.0, z: 5.4, name: '阿杰的座位', code: '505' },
  bay5: { x: 10.6, z: 9.4, name: '小敏的座位', code: '505' },
  canteen: { x: 24.6, z: 6, name: '食堂窗口', code: '1F', zone: 'f1' },
  lobby1: { x: 10, z: 8, name: '一楼大厅', code: '1F', zone: 'f1' },
  classroom: { x: 13.5, z: 12.6, name: '202 教室门口', code: '2F', zone: 'f2' },
  libdesk: { x: 13, z: 17.8, name: '图书馆阅览桌', code: '3F', zone: 'f3' },
  stacks: { x: 18, z: 6, name: '书库', code: '3F', zone: 'f3' },
  tennis: { x: 12, z: 13, name: '网球场', code: '4F', zone: 'f4' },
  garden: { x: 20, z: 13, name: '植物园凉亭', code: '6F', zone: 'f6' },
  gardenBench: { x: 30, z: 12.2, name: '植物园长椅', code: '6F', zone: 'f6' },
  roofcafe: { x: 9, z: 7.8, name: '天台咖啡馆', code: 'R', zone: 'roof' },
  roofedge: { x: 20, z: 23, name: '天台栏杆', code: 'R', zone: 'roof' },
  pitch: { x: 61, z: 46, name: '足球场', code: '校园', zone: 'campus' },
  plaza: { x: 30, z: 33, name: '物理楼前广场', code: '校园', zone: 'campus' },
  courtB: { x: 20, z: 11, name: '羽毛球 2 号场', code: '体育馆', zone: 'gym' },
};
const hm = (h, m = 0) => h * 60 + m;

const CARDS = {};   // v12.1: filled from assets/data/content by loadContent()

/* ------------------------------------------------------------
   Events. Each node: say (lines), then choices / mini game.
   choice: {t, d, fx, min, fb, next, after}
------------------------------------------------------------ */
function buildEvents(day) {
  const crunch = day === 'crunch';
  const W = (m) => Math.round(m * (crunch ? 0.8 : 1));
  const E = [];

  E.push({
    id: 'fit', at: hm(8, 20), loc: 'bay', win: W(130), who: '小陈 · 博士二年级', tag: '数据分析',
    title: '小陈：拟合一直不收敛', line: '小陈：缪子寿命拟出来 3.8 μs，能来看一下吗？',
    status: [['对象', 'μ 衰变谱'], ['事例数', '6,000'], ['拟合 τ', '3.8 μs', 'bad'], ['PDG', '2.197 μs']],
    card: 'fit', npc: 'chen', mood: 'worried',
    persona: '小陈，物理系博士二年级男生，做缪子寿命分析，有点内向但很认真，叫对方“老师”。',
    scene: '小陈用 N₀e^(−t/τ) 拟合缪子衰变时间谱，结果 τ=3.8 μs，远大于 PDG 的 2.197 μs。真正原因是他没加本底项 B（长时间段是平的偶然符合本底），拟合范围也从 0 开始包含了前几个 bin 的电子学死时间效应。',
    rubric: '好的教授会引导他自己发现问题（看残差、加本底、调整拟合范围），而不是直接替他做或敷衍他。',
    expire: { fx: { team: -6, research: -3 }, log: '小陈等了一上午，最后自己把拟合范围砍掉一半，结果还是偏的。' },
    start: 'a',
    nodes: {
      a: {
        say: [['小陈', '老师早！我拟合缪子衰变时间谱，寿命一直拟出来 3.8 μs，跟 PDG 差太多了……'], ['', '屏幕上是一张指数衰减的直方图，尾巴却平平地拖着，像是有一层本底。']],
        choices: [
          { t: '坐下来，一起调参数看看', d: '进入拟合小游戏', next: 'fit' },
          { t: '先问他：本底项加了吗？', d: '引导他自己发现问题', fx: { team: 3, research: 2 }, min: 5, fb: [['小陈', '啊……本底我没加，我以为长时间那段都是信号。'], ['你', '那你调一下试试，我在旁边看。']], next: 'fit' },
          { t: '我在忙，你先自己查查文献', d: '省下时间', fx: { team: -6 }, min: 1, fb: [['小陈', '……好的老师。'], ['', '他默默转回屏幕。下午之前大概不会再来问你了。']] },
        ],
      },
      fit: {
        say: [['', '拖动两个滑块，让橙色模型曲线贴住数据点。χ²/ndf 接近 1 就是好拟合。']],
        mini: 'fit',
        onMini: (r) => r.chi < 1.4
          ? { fx: { research: 8, team: 6 }, min: 20, fb: [['小陈', `τ = ${r.tau.toFixed(3)} μs！跟 PDG 只差 ${Math.abs(r.tau / 2.197 - 1) * 100 < 1 ? '不到 1' : (Math.abs(r.tau / 2.197 - 1) * 100).toFixed(1)}%。原来是本底！`], ['', '他眼睛亮了。这种时刻，是带学生最值得的部分。']] }
          : { fx: { research: 3, team: 3 }, min: 25, fb: [['小陈', `χ²/ndf 还有 ${r.chi.toFixed(2)}……不过方向对了，我再试试加本底。`]] },
      },
    },
  });

  E.push({
    id: 'lecture', at: hm(9, 30), until: hm(10, 10), loc: 'podium', who: '大一新生 · 200 人', tag: '本科教学',
    title: '10:00 大学物理（二）· 狭义相对论', line: '10:00 报告厅上课，学生已经陆续到了',
    status: [['课程', '大学物理（二）'], ['人数', '200'], ['今天', '第 7 讲'], ['麦克风', '有点小声']],
    card: 'lecture', npc: null,
    expire: { fx: { teaching: -15, rep: -5 }, log: '你没去上课。教务处的电话打到了院办。' },
    start: 'a',
    nodes: {
      a: {
        say: [['', '报告厅坐满了大一学生。投影上是今天的题目：时间膨胀与宇宙线缪子。'], ['课代表', '老师，可以开始了吗？后排说麦克风有点小声。']],
        choices: [
          { t: '用宇宙线缪子开场，边讲边抢答', d: '课堂抢答小游戏', next: 'quiz' },
          { t: '照着 PPT 稳稳讲完', d: '不出错，也不出彩', fx: { teaching: 2 }, fb: [['', '你讲得很清楚。前排有人在记笔记，后排有人在睡觉。']], after: { type: 'lecture', min: 90 } },
        ],
      },
      quiz: {
        say: [['你', '先问大家一个问题——'], ['', '倒计时 12 秒，选出正确答案。']],
        mini: 'quiz',
        onMini: (r) => ({ fx: { teaching: 3 + r.right * 4, rep: r.right }, fb: [['', r.right >= 3 ? '全场有人鼓掌。下课后三个学生跑来问能不能进实验室。' : r.right >= 2 ? '气氛不错，有人开始举手追问。' : '有点冷场，不过学生至少醒着。']], after: { type: 'lecture', min: 90 } }),
      },
    },
  });

  E.push({
    id: 'hv', at: hm(10, 35), loc: 'detector', win: W(55), urgent: true, who: '小林 · 硕士一年级', tag: '实验室',
    title: '高压电源报警：漏电流在上升', line: '小林：高压一直跳警告，漏电流在往上爬！',
    status: [['高压', '1650 V', 'bad'], ['漏电流', '38 μA', 'bad'], ['机箱温度', '47 °C', 'bad'], ['湿度', '78%', 'bad']],
    card: 'hv', npc: 'lin', mood: 'shock',
    expire: { fx: { safety: -12, research: -6 }, log: '高压电源自动保护跳闸，两路光电倍增管受损，要重新标定一周。' },
    start: 'a',
    nodes: {
      a: {
        say: [['小林', '老师！高压电源一直跳警告，漏电流在往上爬，我、我要不要先把盖子打开看看？']],
        choices: [
          { t: '先别碰！按程序逐级降高压，再断电', d: '降压小游戏', next: 'hv' },
          { t: '直接拔掉电源插头', d: '最快', fx: { safety: -6, research: -4 }, min: 5, fb: [['', '电源断了，但所有通道瞬间掉压，两个光电倍增管增益漂移，要重新标定。'], ['小林', '……下次我们按程序来。']] },
          { t: '你打开盖子看看，小心点', d: '让学生上', fx: { safety: -20, team: -5 }, min: 3, fb: [['', '带电开盖是高压实验室最典型的事故路径。好在小林犹豫了，你也马上改了口。']] },
        ],
      },
      hv: {
        say: [['', '每档降 200 V。看着圆圈，在它和白色目标圈重合时按 C（或点击按钮）。']],
        mini: 'rhythm',
        onMini: (r) => r.acc >= 0.75
          ? { fx: { safety: 8, research: 4 }, min: 10, fb: [['', '高压平稳降到 0 V，漏电流归零。原来是一根 SHV 线缆的接头受潮了。']], next: 'b' }
          : { fx: { safety: 3 }, min: 12, fb: [['', '有几档过冲，警报响了两次，但总算安全断电。']], next: 'b' },
      },
      b: {
        say: [['小林', '接头换好了。老师，以后怎么避免？']],
        choices: [
          { t: '写一份事故记录，再加一个湿度报警', d: '把一次意外变成制度', fx: { team: 4, safety: 4 }, min: 8, fb: [['小林', '好！我今晚就写，顺便把检修步骤贴在电源旁边。']] },
          { t: '修好就行了，别耽误取数', fx: { safety: -2, research: 1 }, min: 1, fb: [['', '取数继续。同样的问题，下个梅雨季大概还会再来。']] },
        ],
      },
    },
  });

  E.push({
    id: 'admin', at: hm(11, 40), loc: 'admin', win: W(200), who: '王老师 · 院办秘书', tag: '经费报销',
    title: '报销卡住了：发票信息有误', line: '王老师：上个月的住宿发票被财务退回来了',
    status: [['金额', '¥1,820'], ['问题', '抬头 / 税号', 'bad'], ['截止', '今天']],
    card: 'admin', npc: 'wang', mood: 'worried',
    expire: { fx: { integrity: -2, rep: -2 }, log: '报销错过了本月截止，王老师只好下个月再跑一趟。' },
    start: 'a',
    nodes: {
      a: {
        say: [['王老师', '老师，上个月出差的住宿发票，抬头和税号不对，财务退回来了。今天是这个月报销最后一天。']],
        choices: [
          { t: '联系酒店重开发票，我来写情况说明', d: '花点时间，干干净净', fx: { integrity: 4 }, min: 20, fb: [['王老师', '好的，我把酒店电话给您。重开的电子发票下午就能到。']] },
          { t: '算了，这一千八我自己出', fx: { integrity: 1, energy: -3 }, min: 2, fb: [['', '经费没问题了，你的钱包有点问题。']] },
          { t: '能不能找张别的发票先替一下？', fx: { integrity: -15, rep: -4 }, min: 2, fb: [['王老师', '老师，这个真的不行，用不实票据报销属于违规。我当没听到。']] },
        ],
      },
    },
  });

  E.push({
    id: 'rec', at: hm(13, 0), loc: 'bay3', until: hm(23, 20), who: '小周 · 本科四年级', tag: '学生指导',
    title: '小周：推荐信今晚 23:59 截止', line: '小周：推荐信今晚截止，您有空的时候……',
    status: [['申请', '海外博士项目'], ['截止', '23:59', 'bad'], ['材料', '已备齐', 'good']],
    card: 'rec', npc: 'zhou', mood: 'worried', pro: true,
    persona: '小周，本科四年级女生，在组里做过一年缪子探测器的本科科研，性格开朗但此刻有点紧张，叫对方“老师”。',
    scene: '小周申请海外博士项目，推荐信今晚 23:59 截止。她的材料已经整理好，但不好意思催老师。教授今天非常忙，自己的基金也是今晚截止。',
    rubric: '好的教授会诚实评估时间，用具体事例写信或给出可行的替代方案；让学生自己写推荐信、敷衍或冷漠拒绝都会扣分。',
    expire: { fx: { team: -10, rep: -3 }, log: '小周的推荐信没有交上。她说没关系，但组里的人都看见了。' },
    start: 'a',
    nodes: {
      a: {
        say: [['小周', '老师，我申请的项目推荐信今晚截止……我知道您很忙，我已经把成绩单和项目报告整理好放在共享盘了。']],
        choices: [
          { t: '我现在就写，用你做过的探测器项目', d: '30 分钟', fx: { team: 6, rep: 2 }, min: 30, fb: [['', '你写了她调试 SiPM 读出时，连续三晚排查一个噪声源的故事。'], ['小周', '谢谢老师！！']] },
          { t: '你先起草一版，我改完再签', d: '10 分钟', fx: { integrity: -4, team: 2 }, min: 10, fb: [['', '很多地方都这样做，但评审读多了，一眼能看出学生替自己写的模板味。']] },
          { t: '这次真的来不及了，抱歉', fx: { team: -8 }, min: 1, fb: [['小周', '……好，那我问问别的老师。']] },
        ],
      },
    },
  });

  E.push({
    id: 'meeting', at: hm(13, 40), until: hm(14, 10), loc: 'meeting', who: '院长 · 全体教授', tag: '学院事务',
    title: '14:00 院务会：学科评估材料', line: '14:00 院务会，院长点名要国际合作材料',
    status: [['议程', '学科评估'], ['时长', '约 1 小时'], ['你的基金', '今晚截止', 'bad']],
    card: 'meeting', npc: 'dean', mood: 'normal',
    expire: { fx: { rep: -8 }, log: '你缺席了院务会，院长在会上点了你的名。' },
    start: 'a',
    nodes: {
      a: {
        say: [['院长', '人到齐了。学科评估下个月交材料，“国际合作”这一块需要一位老师牵头。'], ['', '全场安静，所有人都在低头看笔记本。']],
        choices: [
          { t: '认领一小块：只负责国际合作的数据表', d: '有边界的承担', fx: { rep: 6, energy: -4 }, fb: [['院长', '好，那数据表就交给你，下周三前给我。']], after: { type: 'meeting', min: 60 } },
          { t: '主动请缨，整块我来牵头', d: '声誉大涨，时间大减', fx: { rep: 10, energy: -8, research: -4 }, fb: [['院长', '太好了！会后我们单独聊。'], ['', '你感觉到自己这个月的周末正在离开。']], after: { type: 'meeting', min: 60 } },
          { t: '说明今晚基金截止，申请下次承担', d: '坦诚，提前离场', fx: { rep: -2, integrity: 2 }, fb: [['院长', '理解。那下次的教学评估你来。']], after: { type: 'meeting', min: 40 } },
        ],
      },
    },
  });

  E.push({
    id: 'disk', at: hm(15, 10), loc: 'rack', win: W(90), urgent: true, who: '赵博士 · 博士后', tag: '计算集群',
    title: '/scratch 满了，模拟作业全挂', line: '赵博士：GPU 集群存储满了，作业全挂了',
    status: [['/scratch', '100%', 'bad'], ['排队作业', '46'], ['上次备份', '3 天前', 'bad']],
    card: 'disk', npc: 'zhao', mood: 'shock',
    expire: { fx: { research: -8, team: -4 }, log: '集群停了一下午，所有人的模拟都往后推了一天。' },
    start: 'a',
    nodes: {
      a: {
        say: [['赵博士', '老师，GPU 集群的 /scratch 满了，大家的 Geant4 模拟全部挂掉。有人在群里建议直接 rm -rf 整个临时目录。']],
        choices: [
          { t: '先把关键结果备份到存储服务器，再清理，并设置配额', d: '40 分钟，一劳永逸', fx: { research: 6, team: 6, safety: 2 }, min: 40, fb: [['赵博士', '备份完了，清出 11 TB。配额脚本我也加上了。']] },
          { t: '按用户统计占用，让大家各自清理', d: '25 分钟', fx: { research: 4, team: 3 }, min: 25, fb: [['', '大部分人在半小时内清掉了旧输出，作业陆续恢复。']] },
          { t: '直接 rm -rf /scratch/*，最快', d: '5 分钟', fx: { research: -10, team: -12 }, min: 5, flag: 'wiped', fb: [['赵博士', '……老师，小雨三周的成像模拟在里面，没有备份。']] },
        ],
      },
    },
  });

  E.push({
    id: 'ln2', at: hm(16, 20), loc: 'labdoor', win: W(25), urgent: true, alarm: true, who: '氧气监测仪 · 小林', tag: '实验室安全',
    title: '缪子实验室氧气浓度报警', line: '缪子实验室 O₂ 报警！液氮杜瓦在漏',
    status: [['O₂ 浓度', '17.8%', 'bad'], ['正常', '20.9%', 'good'], ['杜瓦', '阀门冻住', 'bad'], ['室内', '已无人']],
    card: 'ln2', npc: 'lin', mood: 'shock',
    expire: { fx: { safety: -20 }, log: '氧气报警响了半小时没人处理，安全处直接封了实验室。' },
    start: 'a',
    nodes: {
      a: {
        say: [['', '实验室门口的氧气监测仪在尖叫。透过门上的玻璃，能看到地面铺着一层白雾。', 'alarm'], ['小林', '老师！杜瓦的阀门好像冻住了一直在漏，我刚跑出来，里面没人了！']],
        choices: [
          { t: '屏住呼吸冲进去关阀门', d: '十秒钟就够', fx: { safety: -25, energy: -30 }, min: 10, fb: [['', '你进去不到十秒就开始头晕，小林把你拖了出来。缺氧不会给任何预警。']] },
          { t: '不进去：拉警报、开强排风、通知安全处，等氧浓度恢复', d: '15 分钟', ach: 'safety', fx: { safety: 12, team: 4 }, min: 15, fb: [['', '15 分钟后氧浓度回到 20.6%。安全处的老师戴着呼吸器进去关了阀门。'], ['小林', '还好您拦住我了。']] },
          { t: '让小林戴上口罩进去看看', fx: { safety: -30, team: -15 }, min: 5, fb: [['', '口罩挡不住缺氧。小林在门口犹豫了几秒，被赶来的安全员拦下。']] },
        ],
      },
    },
  });

  E.push({
    id: 'care', at: hm(17, 40), loc: 'bay2', win: W(160), who: '小雨 · 硕士二年级', tag: '学生关怀',
    title: '小雨：我是不是不适合做科研', line: '小雨还在办公区，想跟你聊聊',
    status: [['方向', '宇宙线成像'], ['最近', '话很少'], ['组会', '周五']],
    card: 'care', npc: 'yu', mood: 'worried', pro: true,
    persona: '小雨，硕士二年级女生，做宇宙线缪子成像，最近压力很大、睡不好，说话小声、犹豫，叫对方“老师”。她没有伤害自己的念头，只是很疲惫、自我怀疑。',
    scene: '傍晚，学生办公区只剩小雨。她鼓起勇气问老师自己是不是不适合做科研。',
    rubric: '好的教授会先倾听、不评判、不拿自己的经历比较，给出具体的减负安排，并温和地介绍学校心理咨询资源。说教、敷衍或推迟都会扣分。',
    expire: { fx: { team: -8 }, log: '小雨等到八点，没等到你，背着包走了。' },
    start: 'a',
    nodes: {
      a: {
        say: [['', '学生办公区的人都走了。小雨还坐在电脑前，屏幕上是几周前的成像结果。'], ['小雨', '老师……您有空吗？我最近一直在想，我是不是不适合做科研。']],
        choices: [
          { t: '坐下来，先听她说完', d: '15 分钟', fx: { team: 4 }, min: 15, next: 'listen' },
          { t: '大家都这样，熬过去就好了', fx: { team: -8 }, min: 2, fb: [['小雨', '……嗯，我知道了。'], ['', '她点点头，没再说话。']] },
          { t: '我现在很忙，明天再说吧', fx: { team: -10 }, min: 1, fb: [['', '她说好。明天她大概不会再开口了。']] },
        ],
      },
      listen: {
        sayFn: (S) => [['小雨', S.flags.wiped ? '模拟结果被删掉以后，我每天都睡不好，看到组会的日程就心慌……' : '数据一直对不上，我每天都睡不好，看到组会的日程就心慌……'], ['', '她说得很慢。你没有打断。']],
        choices: [
          { t: '谢谢你告诉我。下周任务减一半；也建议去学校心理中心聊聊，我可以陪你预约', ach: 'mentor', fx: { team: 10, integrity: 2 }, min: 10, fb: [['小雨', '……谢谢老师。我明天就去预约。'], ['', '她第一次笑了一下。']] },
          { t: '给她讲你读博时更惨的经历', fx: { team: -2 }, min: 15, fb: [['', '她礼貌地笑了笑。你的故事很精彩，但这次需要被听见的人是她。']] },
        ],
      },
    },
  });

  E.push({
    id: 'referee', at: hm(18, 30), loc: 'desk', win: W(300), who: '期刊编辑部 · 邮件', tag: '同行评审',
    title: '审稿报告逾期 14 天', line: '邮件：Your review report is overdue',
    status: [['期刊', 'Phys. Rev. D'], ['逾期', '14 天', 'bad'], ['稿件', '32 页']],
    card: 'referee', npc: null,
    expire: { fx: { rep: -3 }, log: '编辑又发了一封提醒邮件，这次抄送了主编。' },
    start: 'a',
    nodes: {
      a: {
        say: [['邮件', 'Dear Professor, this is a kind reminder that your review report for manuscript DN-12045 is now 14 days overdue...']],
        choices: [
          { t: '认真读完，写一份有建设性的审稿意见', d: '40 分钟', fx: { rep: 5, integrity: 3, energy: -4 }, min: 40, fb: [['', '你指出了作者系统误差估计中漏掉的一项，并给了两个具体建议。']] },
          { t: '婉拒，推荐一位更合适的同行', d: '5 分钟', fx: { rep: 1, integrity: 2 }, min: 5, fb: [['编辑', 'Thank you for letting us know. We will contact your colleague.']] },
          { t: '扫一眼摘要，写两行 “Minor revision”', d: '5 分钟', fx: { integrity: -8, rep: -2 }, min: 5, fb: [['', '另一位审稿人写了六页。编辑会记得这个对比。']] },
        ],
      },
    },
  });

  E.push({
    id: 'media', at: hm(19, 30), loc: 'elevator', win: W(70), who: '科普视频记者', tag: '科学传播',
    title: '记者：缪子能“透视”金字塔吗？', line: '记者在电梯口等你做个简短采访',
    status: [['平台', '科普短视频'], ['时长', '1 分钟'], ['观众', '约 50 万']],
    card: 'media', npc: 'rep', mood: 'happy', pro: true,
    persona: '一位科普短视频记者，热情、语速快，会追问“能不能说得更通俗一点”，想要一个抓眼球的说法。',
    scene: '晚上，记者在物理楼电梯口拦住教授，想拍一分钟视频，问宇宙线缪子是不是能“透视”金字塔和大山。',
    rubric: '好的教授会用准确又通俗的类比（例如 X 光片）解释缪子成像，提到真实案例，不夸大（不说能透视一切或人体）。',
    expire: { fx: { rep: -2 }, log: '记者等不到人，改去采访了隔壁组。' },
    start: 'a',
    nodes: {
      a: {
        say: [['记者', '教授您好！我们在做一期“宇宙射线”的科普视频，听说你们的探测器能“透视”大山和金字塔？能用一句话讲讲吗？']],
        choices: [
          { t: '用 X 光片类比：缪子穿过越多物质被吸收越多，空的地方透过来的就多', d: '20 分钟', fx: { rep: 8 }, min: 20, fb: [['记者', '这个好懂！我们配个金字塔的动画。']] },
          { t: '“这个很复杂，你去看论文吧”', fx: { rep: -4 }, min: 2, fb: [['记者', '……好的，谢谢教授。']] },
          { t: '“能看穿一切，未来还能透视人体！”', fx: { rep: -6, integrity: -5 }, min: 5, fb: [['', '这句话第二天被剪成了视频标题。同行在群里转发，配了三个捂脸表情。']] },
        ],
      },
    },
  });

  E.push({
    id: 'sigma', at: hm(21, 0), loc: 'bay', win: W(90), who: '小陈 · 博士二年级', tag: '科研诚信',
    title: '小陈：老师！我看到 5σ 的信号！', line: '小陈：我在数据里看到一个 5.2σ 的峰！',
    status: [['显著性', '5.2σ', 'good'], ['系统误差', '未评估', 'bad'], ['look-elsewhere', '未考虑', 'bad']],
    card: 'sigma', npc: 'chen', mood: 'happy', pro: true,
    persona: '小陈，物理系博士二年级男生，此刻非常兴奋，想今晚就把结果挂 arXiv，叫对方“老师”。',
    scene: '晚上九点，小陈在不变质量谱里看到一个局部显著性 5.2σ 的峰，没有评估系统误差，也没考虑 look-elsewhere 效应。实际上这个峰来自一个噪声电子学通道。',
    rubric: '好的教授会肯定他的热情，同时要求系统误差检查、换切割、考虑 look-elsewhere 效应和组内复核，不急于公开。',
    expire: { fx: { integrity: -4 }, log: '小陈没等到你，把截图发到了大合作组的群里。' },
    start: 'a',
    nodes: {
      a: {
        say: [['小陈', '老师！！我在不变质量谱里看到一个峰，局部显著性 5.2σ！我们要不要今晚就挂 arXiv？']],
        choices: [
          { t: '先冷静：查系统误差、换切割、算 look-elsewhere', d: '30 分钟', ach: 'honest', fx: { research: 8, integrity: 5, team: 3 }, min: 30, fb: [['', '一个小时后，小陈发现那个峰只出现在第 17 号电子学通道。'], ['小陈', '……是噪声。还好没挂出去。']] },
          { t: '太好了，今晚就挂！', fx: { rep: -10, integrity: -10 }, min: 10, fb: [['', '两周后，合作组发现那是一个电子学通道的噪声。撤稿声明比原文还长。']] },
          { t: '让他发到组群里大家一起看看', fx: { team: 2, research: 1 }, min: 3, fb: [['赵博士', '先看看各通道分开的分布？'], ['', '群里讨论到半夜。']] },
        ],
      },
    },
  });

  E.push({
    id: 'fnal', at: hm(21, 45), until: hm(22, 10), loc: 'meeting', who: 'Fermilab · Muon g-2 合作组', tag: '国际合作',
    title: '22:00 跨洋视频会议', line: '22:00 Fermilab 分析会，召集人想听上海组的进展',
    status: [['芝加哥', '09:00 CDT'], ['上海', '22:00'], ['今天的咖啡', '{coffee} 杯']],
    card: 'fnal', npc: null,
    expire: { fx: { rep: -6 }, log: '你错过了跨洋会议，召集人在纪要里写了“上海组无更新”。' },
    start: 'a',
    nodes: {
      a: {
        say: [['', '会议室屏幕亮起。芝加哥那边是早上 9 点，大家端着咖啡；上海这边是晚上 10 点。'], ['召集人', 'Good morning, or good evening! Any update from the Shanghai group on the systematics?']],
        choices: [
          { t: '用 3 页图讲清楚进展和下一步', d: '45 分钟', fx: { rep: 8, research: 4, energy: -5 }, fb: [['召集人', 'Very nice work. Let\'s follow up next week.']], after: { type: 'meeting', min: 45 } },
          { t: '只听不讲，关了摄像头继续写基金', d: '一心二用', fx: { rep: -2 }, fb: [['', '会议的声音在耳边，你的手在写基金。两边都只做了一半。']], after: { type: 'multitask', min: 45 } },
          { t: '请赵博士代为汇报，自己回去写基金', d: '给博士后机会', fx: { team: 5, rep: 2 }, min: 5, fb: [['赵博士', '没问题，我来讲。']] },
        ],
      },
    },
  });

  /* phone calls */
  E.push({
    id: 'p_collab', at: hm(11, 5), phone: true, win: 20, who: '合作组召集人', tag: '电话',
    title: '电话：明天能替我讲 10 分钟吗？', line: '合作组召集人来电',
    status: [], card: null,
    expire: { fx: { rep: -1 }, log: '你漏接了合作组召集人的电话。' },
    start: 'a',
    nodes: { a: { say: [['召集人', '明天的合作组大会，我临时要飞，能不能替我讲 10 分钟进展？slides 我发你。']], choices: [
      { t: '可以，把 slides 发我', fx: { rep: 3, energy: -3 }, min: 3, fb: [['召集人', '太感谢了！']] },
      { t: '这周真的不行，下次一定', fx: { rep: -1 }, min: 2, fb: [['召集人', '理解理解，我再找人。']] },
    ] } },
  });
  E.push({
    id: 'p_family', at: hm(18, 5), phone: true, win: 25, who: '家里', tag: '电话',
    title: '家里来电：今晚回来吃饭吗？', line: '家里来电',
    status: [], card: null,
    expire: { fx: { energy: -3 }, log: '家里的电话没接到。回拨的时候，孩子已经睡了。' },
    start: 'a',
    nodes: { a: { say: [['家里', '今晚回来吃饭吗？孩子说想给你看他做的火箭。']], choices: [
      { t: '视频五分钟，看看火箭，再回来工作', fx: { energy: 8 }, min: 6, fb: [['', '火箭是用卷纸筒做的。你说它的推重比不错。']] },
      { t: '今天截止日，晚点回，给我留点汤', fx: { energy: 2 }, min: 2, fb: [['家里', '好，别太晚。']] },
      { t: '在忙，先挂了', fx: { energy: -4 }, min: 1, fb: [['', '电话那头安静了一秒。']] },
    ] } },
  });
  E.push({
    id: 'p_student', at: hm(20, 35), phone: true, win: 25, who: '本科生 小吴', tag: '电话',
    title: '学生：作业第三题是不是题目错了？', line: '本科生小吴来电问作业',
    status: [], card: null,
    expire: { fx: { teaching: -2 }, log: '作业题的错误第二天才更正，三十个学生白算了一晚上。' },
    start: 'a',
    nodes: { a: { say: [['小吴', '老师打扰了！作业第三题，β = 1.2 的话 γ 会变成虚数……是不是题目印错了？']], choices: [
      { t: '确实错了（应为 0.6），马上发更正通知', fx: { teaching: 5, integrity: 2 }, min: 8, fb: [['小吴', '谢谢老师！我告诉同学们。']] },
      { t: '题目没错，你再想想', fx: { teaching: -4 }, min: 1, fb: [['', '你挂了电话才意识到：β 大于 1，题目确实错了。']] },
    ] } },
  });
  if (crunch) {
    E.push({
      id: 'p_print', at: hm(9, 5), phone: true, win: 15, who: '小林', tag: '电话',
      title: '小林：实验室打印机卡纸了', line: '小林来电',
      status: [], card: null, expire: { fx: { team: -1 }, log: '' }, start: 'a',
      nodes: { a: { say: [['小林', '老师，实验室打印机又卡纸了，组会海报打不出来……']], choices: [
        { t: '教他开侧盖、顺着走纸方向拉出来', fx: { team: 2 }, min: 3, fb: [['小林', '出来了！谢谢老师。']] },
        { t: '找院办报修吧', fx: { team: 0 }, min: 1, fb: [['', '报修单排在明天。']] },
      ] } },
    });
    E.push({
      id: 'p_dean', at: hm(16, 55), phone: true, win: 20, who: '院长', tag: '电话',
      title: '院长：明早要一页纸的亮点总结', line: '院长来电',
      status: [], card: null, expire: { fx: { rep: -2 }, log: '院长的电话没接到，他发了一条长语音。' }, start: 'a',
      nodes: { a: { say: [['院长', '明早校领导来视察，你们组的亮点能不能今晚给我一页纸？']], choices: [
        { t: '好，今晚 30 分钟写好发您', fx: { rep: 4, energy: -4 }, min: 30, fb: [['院长', '辛苦辛苦！']] },
        { t: '用上周组会的亮点页改一改给您', fx: { rep: 2 }, min: 8, fb: [['院长', '可以可以。']] },
        { t: '今晚基金截止，明早九点前给您', fx: { rep: 0, integrity: 1 }, min: 2, fb: [['院长', '行，九点前。']] },
      ] } },
    });
    E.push({
      id: 'p_editor', at: hm(14, 50), phone: true, win: 20, who: '出版社编辑', tag: '电话',
      title: '出版社：教材第 3 章的校样', line: '出版社编辑来电',
      status: [], card: null, expire: { fx: { rep: -1 }, log: '' }, start: 'a',
      nodes: { a: { say: [['编辑', '老师，教材第 3 章的校样有 12 处公式需要您确认，下周一要付印。']], choices: [
        { t: '周末确认，周日晚上发回', fx: { rep: 2, energy: -2 }, min: 2, fb: [['编辑', '好的老师！']] },
        { t: '请我的助教先核对一遍', fx: { team: 1 }, min: 2, fb: [['', '你把任务转给了赵博士。他回了一个“收到”。']] },
      ] } },
    });
  }
  const DAYMAP = { fit: 0, lecture: 0, admin: 0, p_collab: 0, referee: 0, hv: 1, disk: 1, p_family: 1, p_print: 1, care: 2, p_student: 2, p_editor: 2, meeting: 3, ln2: 3, media: 3, p_dean: 3, rec: 4, sigma: 4, fnal: 4 };
  const lw = Object.assign({}, E.find(e => e.id === 'lecture'), { id: 'lecture_w', title: '10:00 大学物理（二）· 洛伦兹变换', line: '周三 10:00 报告厅上课' });
  E.push(lw); DAYMAP.lecture_w = 2;
  E.forEach(e => { e.day = DAYMAP[e.id] ?? 0; });
  return E.map(e => Object.assign({ status: [], state: 'pending' }, e));
}

const QUIZ = [];   // v12.1: filled from assets/data/content by loadContent()

const ACHIEVEMENTS = {};   // v12.1: filled from assets/data/content by loadContent()
const LEVELS = [[0, '讲师'], [120, '助理教授'], [300, '副教授'], [540, '教授'], [820, '讲席教授'], [1150, '杰出教授'], [1500, '传奇导师']];
const SPEAKERS = { '小陈': 'chen', '小周': 'zhou', '小雨': 'yu', '小林': 'lin', '赵博士': 'zhao', '王老师': 'wang', '院长': 'dean', '记者': 'rep', '课代表': 's1', '阿杰': 'jie', '小敏': 'min', '陈老师': 'coach', '隔壁组老师': 'nb', '阿玲': 'partner_ling', '小宇': 'child_xiaoyu' };
/* =========================================================
   A WEEK OF WORK — compact event script (Mon → Sun)
   C(day, time, loc, who, tag, title, line, opening, choices, opts)
   opening / feedback: lines split by "|", "名字：台词" marks a speaker
   choice: [text, fx, minutes, feedback, hint]
   fx: "team+4 research-2 energy+3 grant+5 paper+4"
   ========================================================= */
const DAYS = [];   // v12.1: filled from assets/data/content by loadContent()
function parseFx(s) { const o = {}; (s || '').trim().split(/\s+/).forEach(tok => { const m = tok.match(/^([a-z]+)([+-]\d+)$/); if (m) o[m[1]] = (o[m[1]] || 0) + +m[2]; }); return o; }
function parseLines(s) { if (!s) return []; return s.split('|').map(x => { const m = x.match(/^([^：|]{1,6})：(.+)$/); return m ? [m[1], m[2]] : ['', x]; }); }
const WEEK = [];
function C(day, time, loc, who, tag, title, line, open, choices, o = {}) { WEEK.push(mkC(day, time, loc, who, tag, title, line, open, choices, o)); }
function mkC(day, time, loc, who, tag, title, line, open, choices, o = {}) {
  const [h, m] = time.split(':').map(Number), name = who.split(' · ')[0];
  const phone = loc === 'phone';
  const [efx, elog] = (o.exp || 'rep-2|').split('|');
  return ({
    id: o.id || `w${day}_${time.replace(':', '')}`, day, at: hm(h, m), loc: phone ? undefined : loc, phone, win: o.win || (phone ? 30 : o.u ? 40 : 100),
    urgent: !!o.u, alarm: !!o.alarm, req: o.req, reqNot: o.reqNot, who, tag, title, line, status: o.st || [], card: o.card || null,
    npc: SPEAKERS[name] || null, mood: o.mood || (o.u ? 'shock' : 'normal'),
    expire: { fx: parseFx(efx), log: elog || `没来得及处理：${title}。` },
    pro: o.pro !== false && !/邮件|系统|通知|公告|短信/.test(who),
    persona: `${who}。说话自然、口语化，符合在大学物理系里的身份。`,
    scene: `${tag}：${title}。${(open || '').replace(/\|/g, ' ')}`,
    rubric: o.rubric || '好的教授会诚实、负责、讲安全、尊重学生，也会合理安排自己的时间，不轻易做出违反学术规范或安全规范的决定。',
    start: 'a', nodes: { a: { say: parseLines(open), choices: choices.map(([t, fx, min, fb, d, after]) => ({ t, d, fx: parseFx(fx), flags: (fx.match(/@\w+/g) || []).map(f => f.slice(1)), min: min || 0, fb: parseLines(fb), after: after ? { type: after.split(':')[0], min: +after.split(':')[1] } : undefined, ach: o.ach && fx.includes('+') && o.achOn === t ? o.ach : undefined })) } },
  });
}

/* v12.1: the scripted week (136 events) lives in assets/data/content/week.json; loadContent() feeds it through C(). */

/* --------- quick messages, three or four per weekday --------- */
const QUICK = [];   // v12.1: filled from assets/data/content by loadContent()

function buildDay(d, dayType) {
  const crunch = dayType === 'crunch';
  // v5: flag-gated events, lost students, career difficulty and café rumours
  const st = (typeof S !== 'undefined' && S) || { flags: {}, lost: [], week: 1, intel: {} };
  const flags = st.flags || {}, lost = st.lost || [];
  const okReq = (e) => (!e.req || flags[e.req]) && (!e.reqNot || !flags[e.reqNot]) && !(e.npc && lost.includes(e.npc));
  const wkMul = Math.max(0.8, 1 - 0.04 * ((st.week || 1) - 1)), intel = !!(st.intel && st.intel[d]);
  const det = buildEvents(dayType).filter(e => e.day === d && okReq(e));
  const wk = WEEK.filter(e => e.day === d && okReq(e)).map(e => Object.assign({}, e, { state: 'pending', win: crunch ? Math.round(e.win * 0.85) : e.win }));
  const crisis = (typeof crisisEvents === 'function' ? crisisEvents(d) : []).concat(typeof dataEvents === 'function' ? dataEvents(d) : [], typeof familyEvents === 'function' ? familyEvents(d) : [], typeof careerEvents === 'function' ? careerEvents(d) : [], typeof financeEvents === 'function' ? financeEvents(d) : []);
  const n = d >= 5 ? 2 : (crunch ? 5 : 4);
  const used = new Set(), quick = [];
  let r = d * 97 + 13; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    let k; do { k = Math.floor(rnd() * QUICK.length); } while (used.has(k)); used.add(k);
    const [who, title, open, ch] = QUICK[k];
    const t = hm(9 + Math.floor(rnd() * 13), Math.floor(rnd() * 6) * 10);
    quick.push({ id: `q${d}_${i}`, day: d, at: t, phone: true, win: 45, who, tag: '消息', title, line: title, status: [], card: null, npc: null, state: 'pending',
      expire: { fx: { rep: -1 }, log: '' }, pro: false, start: 'a',
      nodes: { a: { say: parseLines(open), choices: ch.map(([tt, fx, min, fb]) => ({ t: tt, fx: parseFx(fx), min, fb: parseLines(fb) })) } } });
  }
  const all = det.concat(wk, quick, crisis);
  // Shuffle the order of one-step choices so the best answer is not always the first button.
  wk.concat(crisis).forEach(e => { let q = (e.id.split('').reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 7) ^ ((st.week || 1) * 977)) >>> 0; const r = () => (q = (q * 1103515245 + 12345) >>> 0) / 4294967296; const ch = e.nodes.a.choices.slice(); for (let i = ch.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ch[i], ch[j]] = [ch[j], ch[i]]; } e.nodes = Object.assign({}, e.nodes, { a: Object.assign({}, e.nodes.a, { choices: ch }) }); });
  all.forEach(e => {
    if (e.win) e.win = Math.round(e.win * wkMul * (intel && (e.urgent || e.alarm) ? 1.5 : 1));
    if (e.until !== undefined) e.until = e.at + Math.max(20, Math.round((e.until - e.at) * wkMul));
    e.known = !e.phone && !e.urgent && !e.alarm && /组会|上课|教学|课|会议|院务|复试|答辩|讲座|开放日|采访|评审会/.test((e.tag || '') + (e.title || ''));
  });
  return all.sort((a, b) => a.at - b.at);
}


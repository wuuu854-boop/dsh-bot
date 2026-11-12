window.__ModuleLoader__.load({
  id: '@local/dsh-bot',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef, useMemo, useCallback } = React
    const ReactDOM = (() => {
      try {
        return require('react-dom')
      } catch {
        return null
      }
    })()

    const NS = 'dsh-bot'
    const API_BASE = '/dsh-bot/api'
    const PANEL_ID = 'dsh-bot'
    const STORAGE_VOICE = 'dshbot.voice'
    const STORAGE_RAIL = 'dshbot.rail'

    const COPY = {
      zh: {
        panel: 'DSH Bot',
        tagline: '本地智能体 · 全权限',
        brandTag: 'LOCAL AUTONOMOUS UNIT',
        online: '本机在线',
        connecting: '连接中',
        offline: '离线',
        newTask: '新任务',
        tasks: '任务',
        noTasks: '还没有任务',
        welcomeKicker: 'DSH BOT · LOCAL COMPUTER',
        welcomeTitle: '把活交给我。',
        welcomeSub: '一句话交代。剩下的，我在你的电脑上做完。',
        welcomeFoot: '终端 · 文件 · 网络 · 子代理 · 后台任务',
        welcomeTeamCta: '按需添加专家',
        welcomeTeamHint: '不预置角色；需要什么专家就加什么，或直接让老大招。',
        guideOpen: '使用指引',
        guideKicker: '新手上路',
        guideTitle: '4 步认识 DSH Bot',
        guideStep1Title: '一句话交代',
        guideStep1Body: '不用学命令，直接把目标、范围、完成标准说清楚。',
        guideStep1Bullet1: '说清“做到什么算完成”，比说步骤更有用。',
        guideStep1Bullet2: '不确定时先说“先别动，给我方案”。',
        guideStartTask: '新建第一个任务',
        guideStep2Title: '专家按需添加',
        guideStep2Body: '默认只有老大。需要课程、磁盘、软件等专家时再加，不用一次装一堆。',
        guideStep2Bullet1: '每个专家有独立记忆、技能和工作区。',
        guideStep2Bullet2: '也可以直接让老大判断该不该招人。',
        guideAddSpecialist: '添加一个专家',
        guideStep3Title: '常用入口',
        guideStep3Body: '这些入口能省很多重复操作。',
        guideStep3Bullet1: '模板：日报、复盘、智慧职教/刷课。',
        guideStep3Bullet2: '记忆：长期偏好、固定流程、项目背景。',
        guideStep3Bullet3: '语音在输入框右侧，主题在右上角三个点。',
        guideStep4Title: '它怎么动电脑',
        guideStep4Body: '优先读页面/控件，不瞎点坐标；卡住会停下来。',
        guideStep4Bullet1: 'Edge / Chrome / Brave 自动选择，不用手动配。',
        guideStep4Bullet2: '需要授权或遇到弹窗时，Bot 里会出现确认卡。',
        guideStep4Bullet3: '考试、监考、交卷页面不会自动作答。',
        guideSkip: '以后再说',
        guidePrev: '上一步',
        guideNext: '下一步',
        guideDone: '开始使用',
        suggestion1: '看看我的电脑现在在忙什么',
        suggestion2: '把下载文件夹整理一下',
        suggestion3: '给这个项目做一次体检',
        suggestion4: '写个脚本，每天备份我的文档',
        inputPlaceholder: '交代一件事，剩下的我来。',
        inputBusy: '它正在干活。输入可即时插话。',
        attach: '添加附件',
        pasteHint: '可直接粘贴截图',
        dropHint: '松手添加文件 / 截图',
        uploading: '正在上传',
        uploadFailed: '附件上传失败',
        uploadTooLarge: '附件不能超过 20MB',
        removeAttachment: '移除附件',
        dictate: '语音输入',
        voiceStarted: 'Windows 听写已开启，说完再点一次麦克风结束',
        voiceStopped: 'Windows 听写已关闭',
        voiceStop: '结束语音输入',
        voiceUnsupported: '当前环境不支持语音识别',
        voiceFailed: '语音识别失败',
        send: '发送',
        sending: '发送中',
        stop: '停止',
        stopHint: '立即停止当前任务',
        stopDone: '已停止',
        stopping: '停止中…',
        hint: 'Enter 发送 · Shift + Enter 换行',
        difficulty: '任务难度',
        difficultySimple: '简单',
        difficultyStandard: '标准',
        difficultyHard: '困难',
        difficultySimpleHint: '直接给结果，少绕路',
        difficultyStandardHint: '完整执行并验证',
        difficultyHardHint: '深入分析，多一步核验',
        localAccess: '本地电脑',
        computer: '电脑',
        activity: '活动',
        memory: '记忆',
        localComputer: 'LOCAL COMPUTER',
        live: 'LIVE',
        screenUnavailable: '屏幕源未连接',
        screenHint: 'Electron 屏幕抓取不可用。可以从浏览器手动投屏。',
        connectScreen: '浏览器投屏',
        disconnectScreen: '断开投屏',
        screenLocalOnly: '画面只在本机显示',
        cpu: 'CPU',
        memoryLabel: '内存',
        disk: '磁盘',
        apps: '正在运行的窗口',
        noApps: '没有可见窗口',
        workspace: '工作目录',
        copied: '已复制',
        copy: '复制',
        speak: '朗读',
        stopSpeak: '停止朗读',
        reasoning: '思考',
        reasoningHide: '收起思考',
        stalledHint: '90 秒没有新进展，可能卡在授权或等待中。',
        stalledWait: '继续等',
        waitingForInput: '等你确认后继续',
        waitingForInputHint: 'AI 已暂停，不会继续执行',
        working: '正在操作电脑',
        workingOn: '正在',
        thinking: '正在思考下一步',
        queued: '已插话',
        stopped: '已停止',
        error: '出错',
        retry: '重试',
        reset: '重建会话',
        resetConfirm: '重建会话会丢失当前上下文，但保留历史任务。继续？',
        delete: '删除任务',
        deleteConfirm: '删除这个任务？会话记录仍保留在 DSH 历史中。',
        untitled: '新任务',
        justNow: '刚刚',
        minutesAgo: '{n} 分钟前',
        hoursAgo: '{n} 小时前',
        daysAgo: '{n} 天前',
        ranSteps: '执行了 {n} 步',
        noActivity: '还没有动作',
        team: '团队',
        teamTitle: '团队',
        teamRosterTitle: '团队名册',
        teamRosterHint: '老大负责派活和验收；成员在各自会话里执行。',
        teamAssignmentsTitle: '最近派活',
        teamNoAssignments: '还没有派活记录',
        teamFilterAll: '全部',
        teamFilterRunning: '进行中',
        teamFilterSuccess: '完成',
        teamFilterFailed: '失败',
        teamLoadMore: '加载更多',
        teamLead: '老大',
        teamMember: '队员',
        teamNoRoster: '还没有团队成员',
        meetingTitle: '每日晨会',
        meetingHint: '当天第一次打开 DSH 时，全员在 ☀️ 晨会群总结最近工作，老大出纪要。',
        meetingEnabled: '自动晨会',
        meetingWeekdaysOnly: '频率',
        meetingEveryDay: '每天',
        meetingWorkdays: '只在工作日',
        meetingOnlyWhenWork: '触发条件',
        meetingAlways: '每天都开',
        meetingWhenWork: '只在有工作时开',
        meetingRunNow: '立即开晨会',
        meetingLastMinutes: '上次晨会纪要',
        meetingNoMinutes: '还没有晨会纪要。',
        openMeetingGroup: '打开晨会群',
        meetingHistory: '历史纪要',
        meetingChars: '{n} 字',
        meetingExport: '导出纪要',
        meetingExported: '纪要已导出',
        meetingSearch: '搜索日期或内容',
        meetingNoMatch: '没有匹配的纪要',
        meetingSaved: '晨会设置已保存',
        meetingRunStarted: '晨会已开始，稍后看群',
        meetingFailed: '晨会操作失败',
        loadEarlier: '加载更早',
        noMoreHistory: '没有更早的消息了',
        replyYou: '你',
        replay: '回放',
        replayTitle: '对话回放',
        replayEmpty: '这个任务还没有可回放的消息。',
        replayBot: 'Bot',
        replayPlay: '播放',
        replayPause: '暂停',
        replayStep: '回放进度',
        problemTitle: '这次没做成',
        problemUnknown: '执行中断了，但还没有拿到明确原因。',
        problemTried: '已经尝试',
        problemRetry: '重试一次',
        problemRephrase: '换个办法',
        problemCopy: '复制诊断',
        problemCopyDone: '诊断已复制',
        copyFailed: '复制失败',
        problemDetails: '技术细节',
        problemPrompt: '刚才的任务没有完成。请先用中文说明卡在哪一步、可能原因，再换一种更简单的方法继续；不要重复失败的命令。',
        modelMissing: '还没有可用模型',
        technicalDetails: '技术细节（可选）',
        intentWebRead: '读取网页内容',
        intentWebOpen: '打开网页',
        intentWebClick: '点击网页控件',
        intentWebType: '填写网页表单',
        intentDisk: '检查磁盘空间',
        intentProcess: '查看运行中的程序',
        intentFile: '浏览文件',
        intentWait: '等待任务继续',
        intentCommand: '执行一条本机操作',
        intentImage: '查看屏幕画面',
        intentDelegate: '把任务派给',
        intentHire: '招聘新专家',
        intentSearch: '搜索',
        updateAvailable: '发现新版本 v{version}',
        updateHint: '下载新版安装包，重启 DSH 后生效。',
        updateDownload: '下载新版本',
        updateLater: '稍后提醒',
        theme: '界面主题',
        themeDark: '暗色',
        themeWarm: '暖色',
        themeInk: '水墨',
        themeAurora: '雾海',
        themeEmber: '陶土',
        themeDarkHint: '黑绿 · 克制高对比',
        themeWarmHint: '奶油纸 · 陶土橙',
        themeInkHint: '宣纸 · 水墨朱砂',
        themeMistHint: '冷雾青 · 海沫低饱和',
        themeClayHint: '暖石 · 杏色与陶土',
        modelMissingHint: '请先在 DSH 设置里接入 API 并选择默认模型，再发任务。',
        modelRetry: '重新检测',
        modelConnected: '模型已连接',
        quoteJump: '跳到原消息',
        quote: '引用',
        pinMessage: '置顶',
        unpinMessage: '取消置顶',
        pinnedMessage: '置顶消息',
        pinSaved: '已置顶',
        unpinSaved: '已取消置顶',
        pinnedList: '置顶列表',
        pinnedClearAll: '全部取消置顶',
        searchTitle: '搜索消息',
        searchPlaceholder: '搜索会话、记忆，或输入命令…',
        searchEmpty: '没有匹配的消息或记忆',
        searchHint: 'Ctrl K 打开命令中心；输入关键词搜索全部会话与记忆',
        commandTitle: '命令中心',
        searchNotLoaded: '这条消息在更早的历史里，请先加载更早',
        searchScopeThread: '本会话',
        searchScopeAll: '全部会话',
        exportThread: '导出会话',
        exported: '会话已导出',
        exportFailed: '导出失败',
        pinsTitle: '收藏夹',
        pinsEmpty: '还没有收藏或置顶消息',
        pinsRemove: '移除收藏',
        renameHint: '双击重命名',
        renamed: '标题已更新',
        pin: '置顶',
        unpin: '取消置顶',
        archive: '归档',
        unarchive: '取消归档',
        showArchived: '显示已归档（{n}）',
        hideArchived: '隐藏已归档',
        archived: '已归档',
        unarchived: '已取消归档',
        teamHint: '主 Bot 派生的子代理会出现在这里，并行干活。',
        teamEmpty: '没有子代理在跑。',
        qualityTitle: '质量',
        runs: '轮次',
        success: '成功',
        failed: '失败',
        successRate: '成功率',
        verified: '已验收',
        needsReview: '待人工',
        verifiedRate: '验收率',
        verdictPassed: '通过',
        verdictReview: '待验',
        verdictFailed: '未过',
        notify: '通知',
        notifyTitle: 'QQ 通知',
        notifyHint: '只在任务完成、失败或中断时通过 QQ 提醒你；中间步骤、看门狗和自动继续不重复发。SMTP 用 QQ 邮箱授权码；桌面模式需要 QQ 已登录。',
        notifyEnabled: '启用通知',
        notifyOn: '开',
        notifyOff: '关',
        notifyRemoteControl: '允许 QQ 远程命令',
        notifyRemoteHint: '只读取「联系人」当前聊天窗口；支持 /tasks、/use N、/status、/stop、/continue、/retry（也可用 /任务、/切换 N、/状态、/停止、/继续、/重试）。',
        notifySuccessMode: '通知范围',
        notifySuccessAll: '完成和中断都发',
        notifySuccessFailures: '只发中断/失败',
        notifyQuietStart: '免打扰开始',
        notifyQuietEnd: '免打扰结束',
        notifyInterval: '最小发送间隔（秒）',
        budgetTitle: '运行预算',
        budgetHint: '单任务超过任一上限会自动写 checkpoint 并停止，避免无人值守时跑飞。',
        budgetMinutes: '最长分钟',
        budgetTools: '最多工具调用',
        budgetTokens: '最多 token',
        notifyMethod: '发送方式',
        notifySmtp: 'QQ 邮箱 SMTP',
        notifyDesktop: 'QQ 桌面版',
        notifyEmail: 'QQ 邮箱',
        notifyAuth: 'SMTP 授权码',
        notifyTo: '收件 QQ 邮箱',
        notifyContact: 'QQ 联系人 / 群',
        notifySave: '保存',
        notifyTest: '发送测试',
        notifySaved: '通知设置已保存',
        notifyTested: '测试消息已发送',
        notifyFailed: '通知失败',
        notifyStatus: '通知状态',
        notifyNoSend: '还没有发送过',
        lastSent: '上次发送',
        safetyTitle: '安全 / 撤销',
        safetyEmpty: '还没有破坏性操作快照。',
        snapshotFiles: '个路径',
        undoSnapshot: '撤销',
        restored: '已恢复',
        undoing: '撤销中',
        undoDone: '已撤销快照',
        undoFailed: '撤销失败',
        steps: '步',
        noRuns: '还没有任务记录。',
        checkpointTitle: '上次任务中断，可从断点继续',
        checkpointHint: '会带上目标、最后动作和错误，不再从头重做。',
        resume: '从断点继续',
        resuming: '恢复中',
        resumed: '已从断点继续',
        skills: '技能',
        skillTitle: '技能库',
        skillHint: '需要复用时，在任务卡里手动存为技能；不会再把一次性提示词自动塞进技能库。',
        skillEmpty: '还没有技能。完成任务后在任务卡里点“存为技能”即可。',
        skillAuto: '自动',
        skillUses: '用过',
        skillSuccessRate: '成功率',
        params: '参数',
        skillRun: '运行',
        skillDelete: '删除',
        skillSaveCurrent: '保存当前任务为技能',
        skillSaved: '已保存为技能',
        skillSaveFailed: '保存技能失败',
        skillRunning: '已按技能开始新任务',
        skillRunFailed: '运行技能失败',
        skillDeleted: '技能已删除',
        bots: 'Bot',
        newBot: '新建 Bot',
        editBot: 'Bot 设置',
        manageBots: '管理 Bot',
        botName: '名字',
        botEmoji: '头像',
        botTagline: '一句话定位',
        botPersona: '额外设定',
        botPersonaHint: '只对这个 Bot 生效：角色、语气、专长和边界。',
        botPersonaPlaceholder: '例如：你擅长网页检索，先找证据再下结论。',
        botPreset: 'Agent Preset',
        botPresetAuto: '跟随默认',
        botModel: '模型',
        botModelAuto: '跟随默认',
        botWorkspace: '工作目录',
        botWorkspaceHint: '留空使用全局工作目录；必须是绝对路径。',
        botPrivilege: '权限模式',
        botPrivilegeStandard: '标准（文件沙箱）',
        botPrivilegeAdmin: '完全权限 + 管理员',
        adminAckLabel: '我理解管理员操作会直接执行，并允许该 Bot 使用管理员权限',
        adminConfirmRequired: '勾选管理员权限确认后才能保存',
        botPrivilegeHint: '完全权限会关闭 DSH 文件沙箱，并允许 bot 用 admin_exec.py 提权执行管理员命令。只对你信任的 Bot 开启。',
        botAutonomy: '任务模式',
        botAutonomyInteractive: '交互（必要时可拍板）',
        botAutonomyUnattended: '无人值守（不打断，按模型判断）',
        botAutonomyHint: '无人值守模式会禁用 bot_ask，不允许用问句结束；信息不足时按最合理假设继续，最多自动接管 8 次。适合你不在电脑前时使用。',
        botMemoryHint: '每个 Bot 有独立的长期记忆。',
        botDelete: '删除 Bot',
        botDeleteConfirm: '删除这个 Bot 及其任务和例程？DSH 历史会话仍会保留。',
        botDefault: '默认',
        botSave: '保存',
        botSaving: '保存中',
        botCreated: 'Bot 已创建',
        botUpdated: 'Bot 已更新',
        privilegeLiveFailed: '权限已保存，但当前会话切换失败',
        botDeleted: 'Bot 已删除',
        botNamePlaceholder: '例如：侦察员',
        botNameRequired: '请填写 Bot 名字',
        botTaglinePlaceholder: '例如：网页与资料检索',
        botWorkspacePlaceholder: 'D:\\projects',
        catalogFailed: '目录读取失败，可手动填写模型',
        routines: '例程',
        routineTitle: '例程',
        routineHint: '把重复的事交给时间。DSH 开着时，例程会自动运行。',
        routineEmpty: '还没有例程。',
        routineEmptyHint: '选一个模板开始，时间和内容之后都能改。',
        routinePresetDailyTitle: '每日工作摘要',
        routinePresetDailyPrompt: '每天汇总今天完成的任务、失败的任务和明天要注意的事，控制在 5 条以内。',
        routinePresetWeeklyTitle: '每周文件盘点',
        routinePresetWeeklyPrompt: '盘点本周工作区新增和修改的文件，列出重要变化和需要清理的临时文件。',
        routinePresetHourlyTitle: '每小时任务巡检',
        routinePresetHourlyPrompt: '检查当前运行中和最近失败的任务；没有异常就只回复一句“正常”。',
        routineNew: '新建例程',
        routineEdit: '编辑例程',
        routineName: '名称',
        routinePrompt: '每次执行什么',
        routinePromptPlaceholder: '例如：扫描工作区变化，给我一句话摘要。',
        routineSchedule: '运行计划',
        routineDaily: '每天',
        routineWeekly: '每周',
        routineEvery: '每隔',
        routineCron: 'Cron',
        routineCronUnsupported: '暂不支持',
        routineTime: '时间',
        routineWeekdays: '星期',
        routineInterval: '间隔',
        routineMinutes: '分钟',
        routineHours: '小时',
        routineExpression: 'Cron 表达式',
        routineEnabled: '运行中',
        routinePaused: '已暂停',
        routineRun: '立即运行',
        routineDelete: '删除例程',
        routineDeleteConfirm: '删除这个例程？已经跑过的任务会保留。',
        routineCreate: '创建',
        routineSave: '保存',
        routineSaveRun: '保存并运行',
        routineSaved: '例程已保存',
        routineDeleted: '例程已删除',
        routineRunning: '已开始',
        routineNext: '下次',
        routineNoSchedule: '未排期',
        routineError: '例程操作失败',
        routineNameRequired: '请填写名称',
        routinePromptRequired: '请填写执行内容',
        routineEveryHint: '至少 1 分钟',
        dailyAt: '每天 {time}',
        weeklyAt: '每周 {days} {time}',
        everyMinutes: '每 {n} 分钟',
        everyHours: '每 {n} 小时',
        cronAt: 'Cron {expression}',
        lastRun: '上次 {when}',
        neverRun: '还没跑过',
        weekday1: '一',
        weekday2: '二',
        weekday3: '三',
        weekday4: '四',
        weekday5: '五',
        weekday6: '六',
        weekday7: '日',
        botCount: '{n} 个 Bot',
        taskRoutine: '例行',
        memoryTitle: '长期记忆',
        memoryHint: 'DSH 会把这页内容带进每次任务。写下你的偏好、项目背景和常用流程。',
        saveMemory: '保存记忆',
        memorySaved: '记忆已保存',
        memoryEmpty: '还没有记忆。',
        stats: '本次任务',
        turns: '轮次',
        tools: '工具',
        tokens: 'Tokens',
        elapsed: '耗时',
        model: '模型',
        loading: '正在连接本机…',
        backendDown: '后端未就绪',
        backendHint: '请确认插件已启用，然后刷新页面。',
        reload: '重试',
        offlineBanner: '与 DSH Bot 的连接断开了。',
        stopHint: '停止当前任务',
        taskRunning: '执行中',
        taskIdle: '待命',
        openComputer: '电脑',
        closeComputer: '收起',
        memorySaveFailed: '保存失败',
        sendFailed: '发送失败',
        newTaskFailed: '新建任务失败',
        resetFailed: '重建失败',
        notifTitle: 'DSH 回来了',
        notifBody: '任务已完成，回来看看。',
        connectFailed: '无法获取屏幕',
        scrollBottom: '回到最新',
        contextWindow: '上下文',
        memoryPath: '记忆文件',
        copiedPath: '路径已复制',
        sessionLabel: 'SESSION',
        localLabel: 'LOCAL',
        refresh: '刷新',
        lastUpdated: '更新于',
        voiceOn: '语音开',
        voiceOff: '语音关',
        runLog: '动作日志',
        currentTool: '当前工具',
        diskFree: '可用',
        appCount: '{n} 个窗口',
        botStatus: '本机代理',
        taskMenu: '任务菜单',
        confirm: '确认',
        cancel: '取消',
        close: '关闭',
        open: '打开',
        collapse: '收起',
        expand: '展开',
        noPreview: '暂无预览',
        clickRefresh: '点击刷新',
        noScreen: '未连接',
        voice: '语音',
        fullAccess: '本机权限',
        adminMode: '管理员权限',
        adminModeHint: '该 Bot 有管理员权限，系统级操作会直接执行；可在 Bot 编辑里改回标准权限。',
        system: '系统',
        host: '主机',
        user: '用户',
        modelAuto: '自动',
        threadEmpty: '这个任务还没有消息。',
        steerHint: '发送将即时插入当前步骤',
        queueHint: '发送将排到下一轮',
        waitingFirst: '等待你的第一句话',
        botOnline: '在线',
        modelLabel: '模型',
        apiError: '请求失败',
        sessionReset: '会话已重建',
        menu: '菜单',
        sendHint: 'Ctrl / Cmd + Enter 也可发送',
        template: '模板',
        templateTitle: '任务模板',
        templateHomework: '网页作业',
        templateHomeworkPrompt: '帮我做这个网页作业：<粘贴作业 URL>。先用 python scripts/edge.py open <URL> 打开，一次 read 读取全部题目和控件；逐题作答/填写，提交后用 read 确认。不要截图，只有 canvas/PDF/图片题才回退视觉。',
        templateRead: '网页速读',
        templateReadPrompt: '打开 <URL>，用 edge.py read 读取全文；长页面先 scroll down 再 read；输出 5 条要点、关键数据和原文引用。不要截图。',
        templateCleanup: '磁盘清理',
        templateCleanupPrompt: '只盘点 C 盘和 E 盘的空间、缓存、旧备份、回收站和重复文件，输出可清理清单与预计释放空间；不要删除任何文件，等我确认。',
        templateReview: '今日复盘',
        templateReviewPrompt: '汇总最近 24 小时团队各 Bot 的运行记录：完成了什么、失败/中断了什么、下一步建议。不要重新执行任务。',
        templateResearch: '深度调研',
        templateResearchPrompt: '对 <主题> 做一次深度调研：先列 3 个关键问题，用 web_search 找至少 4 个独立来源，交叉验证并标注冲突；把带链接、日期和结论的报告写到 report/research-<日期>.md，最后给出 5 条可执行建议。不要编造来源。',
        templateWorkbench: '隔离工作台',
        templateWorkbenchPrompt: '用 python scripts/sandbox.py status 检查本机隔离方式；用 create --name <任务名> [--copy <路径>] 建一个工作台，open --name <任务名> 打开。之后的实验只在工作台里做，结束报告 workspace/profile 路径和改动，不要动日常浏览器资料。',
        templateOcr: '看图 / OCR',
        templateOcrPrompt: '当前页面或图片没有可读控件树时：先用 python scripts/computer.py window-shot <窗口标题> <png> 截目标窗口，再用 python scripts/ocr.py window <窗口标题> --lang eng（有中文包时 eng+chi_sim）；根据 OCR 文本再决定操作。不要默认全屏截图。',
        templateCheckup: '电脑体检',
        templateCheckupPrompt: '做一次只读电脑体检：python scripts/computer.py screen / windows、查看磁盘剩余、内存/CPU、启动项和异常进程；输出一份带数据的报告，不要删除文件、不要改设置。需要清理时只给建议，等用户确认。',
        templatePpt: '做 PPT',
        templatePptPrompt: '为 <主题> 做一份真正可用的 PPT：先确认受众、页数、风格（midnight/warm/mono/aurora/ember），然后用 python scripts/studio.py ppt --out <路径.pptx> --spec <spec.json> 生成；spec 至少包含 title、subtitle、theme、slides（bullets/stats/quote/section）。生成后只检查页数和文件存在，不要检查 XML/字体/形状几何，不要寻找 LibreOffice；通过就立即汇报路径和每页要点。',
        templateDoc: '写文档',
        templateDocPrompt: '把 <主题/素材> 写成 docx：先整理 Markdown（标题、段落、表格、列表），再用 python scripts/studio.py doc --out <路径.docx> --markdown <文件.md> 生成；检查标题、表格和段落，给我文件路径和 3 条修改建议。',
        templateSheet: '做表格',
        templateSheetPrompt: '把 <数据/CSV> 做成带样式的 xlsx：先整理 CSV 或 JSON，再用 python scripts/studio.py sheet --out <路径.xlsx> --csv <文件.csv> --title <标题> 生成；检查行数、表头、数字格式和图表，给我文件路径与数据摘要。',
        templateGame: '做小游戏',
        templateGamePrompt: '做一个可直接玩的单文件 HTML 小游戏：用 python scripts/studio.py game --out <路径.html> --kind snake|memory|runner --title <标题> 生成；然后打开检查，给我玩法、操作键和文件路径。需要更多关卡/美术/音效时在生成物上继续迭代。',
        templateMusic: '做音乐',
        templateMusicPrompt: '生成一段 <风格：lofi/upbeat/ambient> 的本地音乐：用 python scripts/studio.py music --out <路径.wav> --style <风格> --seconds <秒数> 生成 wav + mid；给出时长、BPM、文件路径。说明这是本地合成，不是云端模型；需要重新编曲就改参数重生成。',
        templateVocational: '智慧职教 / 刷课',
        templateVocationalPrompt: '打开智慧职教课程页 <粘贴 URL>。先 python scripts/course.py progress 看已完成/未完成（fast 缓存；cached:true 不要重复读），再用 course.py status 判断 phase。视频用 course.py play，PPT 用 course.py ppt，题目用 course.py question 读题干和选项，再用 course.py answer --choice N --submit 作答，完成后 course.py next 进入下一回合。动作命令会返回 page/phase/progress，直接采用它，不要每个动作再跑一次 full status；只有 page 缺失、缓存过期或卡住时才 course.py status --full。如果 click 返回 changed:false/stalled:true，禁止重复点击，先 read --all 检查 iframe、scroll、wait-change，仍无变化就停下说明卡点。检测到考试/监考/交卷页面必须停止，不自动作答。',
        attachment: '附件',
        attachmentCopy: '复制路径',
        attachmentCopied: '已复制',
        attachmentPreview: '预览图片',
        attachmentPrev: '上一张',
        attachmentNext: '下一张',
        attachmentDownload: '下载',
        zoomIn: '放大',
        zoomOut: '缩小',
        zoomReset: '重置缩放',
        attachmentImages: '图片',
        attachmentPdfs: 'PDF',
        attachmentSheets: '表格',
        attachmentCodeFiles: '代码',
        attachmentFiles: '文件',
        imageRefreshed: '画面已刷新',
        context: '上下文',
        thinkingDone: '思考完成',
        questionKicker: '需要你拍板',
        questionTitle: 'DSH 在等你回答',
        questionSubmit: '提交回答',
        questionSkip: '跳过',
        questionOther: '其他 / 自定义',
        questionMulti: '可多选',
        questionHint: '回答后它会继续。',
        questionSubmitting: '提交中',
        approvalKicker: '需要授权',
        approvalTitle: 'AI 正在等你授权',
        approvalAllow: '允许一次',
        approvalDeny: '拒绝',
        approvalReason: '原因',
        approvalHint: 'AI 已暂停，不会继续执行；这次决定只影响当前调用。',
        approvalNativeKicker: 'DSH 原生授权',
        approvalNativeTitle: 'DSH 正在等你授权',
        approvalNativeHint: '授权弹窗在 DSH 主界面左侧会话里，Bot 不能代点。请回到 DSH 处理，或先停止任务。',
        approvalNativeOpen: '回到 DSH 处理',
        approvalNativeManual: '请点左上角「新会话」返回 DSH 处理授权，不要刷新页面。',
        stoppedByUser: '你停止了这一轮',
        retryHint: '让 DSH 继续',
        offlineHint: '后台没有响应，正在重试…',
        memoryPlaceholder: '例如：\n- 我在 Windows 上工作，常用 PowerShell\n- 项目都在 D:\\projects\n- 回答默认用中文，少客套',
        memoryHistory: '版本历史',
        memoryHistoryHint: '每次保存都会提交一次 Git 版本，可查看差异并回滚。',
        memoryHistoryEmpty: '还没有提交记录。保存一次就会生成。',
        memoryDiff: '差异',
        memoryRestore: '恢复这一版',
        memoryRestored: '已恢复到所选版本',
        memoryNoGit: '本机没有 Git，记忆仍可保存，但不会有历史。',
        memoryDirty: '有未提交修改',
        tool_bash: '运行命令',
        tool_read: '读取文件',
        tool_write: '写入文件',
        tool_edit: '修改文件',
        tool_glob: '扫描文件',
        tool_grep: '搜索内容',
        tool_web_search: '联网搜索',
        tool_web_fetch: '抓取网页',
        tool_subagent: '派出子代理',
        tool_workflow: '编排工作流',
        tool_present: '交付文件',
        tool_todo_write: '更新计划',
        tool_create_goal: '设定目标',
        tool_update_goal: '推进目标',
        tool_ask_user_question: '询问你',
        tool_bot_ask: '等你决定',
        tool_skill: '加载技能',
        tool_read_image: '查看图片',
        tool_job_output: '读取后台任务',
        tool_job_list: '查看后台任务',
        tool_send_message: '联系子代理',
        tool_terminal_open: '打开终端',
        tool_terminal_read: '读取终端',
        tool_run_code: '执行代码',
        tool_exit_plan_mode: '退出计划模式',
        tool_cordis_inspect_query: '检查运行时',
        tool_schedule_create: '创建定时任务',
        tool_default: '执行工具',
        group: '群聊',
        groups: '群聊',
        newGroup: '新建群聊',
        editGroup: '群聊设置',
        groupName: '群名称',
        groupNamePlaceholder: '例如：增长复盘、网站上线',
        groupMembers: '成员（至少 2 位）',
        groupCreate: '建群',
        groupSave: '保存',
        groupSaving: '保存中',
        groupDelete: '删除群聊',
        groupDeleteConfirm: '删除这个群聊？成员各自的会话历史会一起移除。',
        groupMinMembers: '至少选 2 位成员',
        groupHint: '不 @ 时按下面的消息路由；@ 名字只发给他。',
        groupRouting: '消息路由',
        groupRoutingAll: '全员：不 @ 时所有成员都回复',
        groupRoutingLeader: '群主：不 @ 时先由群主处理，可派活',
        groupRoutingHint: '群主模式更安静；需要全员讨论时使用 @all。',
        groupMembersCount: '{n} 位成员',
        groupMentionAll: '全员',
        groupEmpty: '群里还没有消息',
        groupWelcome: '发一句话，@ 谁谁答。',
        groupCreated: '群聊已创建',
        groupUpdated: '群聊已更新',
        groupDeleted: '群聊已删除',
        speaker: '成员',
        atMember: '@ 成员',
        tool_bot_dispatch: '派活给成员',
        role: '团队角色',
        roleMember: '队员',
        roleLead: '老大（可给队员派活）',
        roleHint: '老大只跟你对话，把任务派给队员；队员在各自会话里执行，结果自动回到老大。',
        botEffort: '思考强度',
        botEffortAuto: '跟随默认',
        botEffortHint: '所有 Bot 统一使用当前最新模型；这里只调思考强度。老大 max，队员 high；不提供 low。',
        teamTemplate: '添加专家',
        teamTemplateConfirm: '建立/刷新团队模板？会创建或补全「老大 / 磁盘清理 / 大学事务」三个 Bot，不会覆盖你改过的设定。',
        teamTemplateDone: '团队已就绪：直接和老大对话就行',
        teamTemplateFailed: '建立团队失败',
        assignmentTo: '已派给',
        assignmentRunning: '进行中',
        assignmentDone: '已完成',
        assignmentFailed: '失败',
        assignmentAborted: '已中断',
        assignmentSummary: '结果',
        assignmentStats: '{steps} 步 · {duration} · {tokens}',
        assignmentRetried: '已重新派活，回执会回到这里',
        assignmentRetryCount: '第 {n} 次重试',
        hireMember: '新成员',
      },
      en: {
        panel: 'DSH Bot',
        tagline: 'LOCAL AGENT · FULL ACCESS',
        brandTag: 'LOCAL AUTONOMOUS UNIT',
        online: 'LOCAL ONLINE',
        connecting: 'CONNECTING',
        offline: 'OFFLINE',
        newTask: 'New task',
        tasks: 'Tasks',
        noTasks: 'No tasks yet',
        welcomeKicker: 'DSH BOT · LOCAL COMPUTER',
        welcomeTitle: 'Give me the work.',
        welcomeSub: 'One sentence. I will finish it on your computer.',
        welcomeFoot: 'Terminal · Files · Web · Subagents · Background jobs',
        welcomeTeamCta: 'Add a specialist',
        welcomeTeamHint: 'No preset roles; add exactly the specialist you need, or ask the Boss to hire one.',
        guideOpen: 'Guide',
        guideKicker: 'GETTING STARTED',
        guideTitle: 'Meet DSH Bot in 4 steps',
        guideStep1Title: 'Just describe the job',
        guideStep1Body: 'No commands to learn. State the goal, scope and what “done” means.',
        guideStep1Bullet1: 'Say what counts as finished, not every step.',
        guideStep1Bullet2: 'When unsure, ask for a plan before changes.',
        guideStartTask: 'Create my first task',
        guideStep2Title: 'Add specialists on demand',
        guideStep2Body: 'You start with the Boss only. Add course, disk or software experts when needed.',
        guideStep2Bullet1: 'Each specialist has its own memory, skills and workspace.',
        guideStep2Bullet2: 'Or let the Boss decide whether hiring is worthwhile.',
        guideAddSpecialist: 'Add a specialist',
        guideStep3Title: 'Everyday entries',
        guideStep3Body: 'These save repeated setup work.',
        guideStep3Bullet1: 'Templates: daily report, review, vocational course runner.',
        guideStep3Bullet2: 'Memory: long-term preferences, routines and project context.',
        guideStep3Bullet3: 'Voice sits by the composer; themes sit under the top-right menu.',
        guideStep4Title: 'How it drives the computer',
        guideStep4Body: 'It reads pages and controls first, not blind coordinates; it stops when stuck.',
        guideStep4Bullet1: 'Edge / Chrome / Brave are selected automatically.',
        guideStep4Bullet2: 'Approvals and popups appear as a card inside the Bot.',
        guideStep4Bullet3: 'Exam and proctored pages are never auto-answered.',
        guideSkip: 'Later',
        guidePrev: 'Back',
        guideNext: 'Next',
        guideDone: 'Start using it',
        suggestion1: 'See what my computer is busy with',
        suggestion2: 'Clean up my Downloads folder',
        suggestion3: 'Run a health check on this project',
        suggestion4: 'Write a script to back up my documents daily',
        inputPlaceholder: 'Give me one job. I will handle the rest.',
        inputBusy: 'It is working. Type to steer it mid-step.',
        attach: 'Attach files',
        pasteHint: 'Paste a screenshot directly',
        dropHint: 'Drop files / screenshots here',
        uploading: 'Uploading',
        uploadFailed: 'Upload failed',
        uploadTooLarge: 'Attachments must be under 20MB',
        removeAttachment: 'Remove attachment',
        dictate: 'Voice input',
        voiceStarted: 'Windows voice typing is on; click the mic again to stop',
        voiceStopped: 'Windows voice typing is off',
        voiceStop: 'Stop voice input',
        voiceUnsupported: 'Speech recognition is unavailable here',
        voiceFailed: 'Speech recognition failed',
        send: 'Send',
        sending: 'Sending',
        stop: 'Stop',
        stopHint: 'Stop the running task immediately',
        stopDone: 'Stopped',
        stopping: 'Stopping…',
        hint: 'Enter to send · Shift + Enter for a new line',
        difficulty: 'Task difficulty',
        difficultySimple: 'Simple',
        difficultyStandard: 'Standard',
        difficultyHard: 'Hard',
        difficultySimpleHint: 'Give the result with minimal detours',
        difficultyStandardHint: 'Execute fully and verify',
        difficultyHardHint: 'Deeper analysis with extra checks',
        localAccess: 'Local computer',
        computer: 'Computer',
        activity: 'Activity',
        memory: 'Memory',
        localComputer: 'LOCAL COMPUTER',
        live: 'LIVE',
        screenUnavailable: 'No screen source',
        screenHint: 'Electron screen capture is unavailable. You can share the screen from the browser.',
        connectScreen: 'Share screen',
        disconnectScreen: 'Stop sharing',
        screenLocalOnly: 'This preview stays on this machine',
        cpu: 'CPU',
        memoryLabel: 'Memory',
        disk: 'Disk',
        apps: 'Open windows',
        noApps: 'No visible windows',
        workspace: 'Workspace',
        copied: 'Copied',
        copy: 'Copy',
        speak: 'Read aloud',
        stopSpeak: 'Stop reading',
        reasoning: 'Thinking',
        reasoningHide: 'Hide thinking',
        stalledHint: 'No progress for 90 seconds; it may be stuck waiting for approval.',
        stalledWait: 'Keep waiting',
        waitingForInput: 'Waiting for your decision',
        waitingForInputHint: 'The AI is paused and will not continue',
        working: 'Working the computer',
        workingOn: 'Working',
        thinking: 'Thinking about the next step',
        queued: 'Steered',
        stopped: 'Stopped',
        error: 'Error',
        retry: 'Retry',
        reset: 'Rebuild session',
        resetConfirm: 'Rebuilding loses the current context but keeps task history. Continue?',
        delete: 'Delete task',
        deleteConfirm: 'Delete this task? The session log stays in DSH history.',
        untitled: 'New task',
        justNow: 'just now',
        minutesAgo: '{n}m ago',
        hoursAgo: '{n}h ago',
        daysAgo: '{n}d ago',
        ranSteps: 'Ran {n} steps',
        noActivity: 'No activity yet',
        team: 'Team',
        teamTitle: 'Team',
        teamRosterTitle: 'Team roster',
        teamRosterHint: 'The lead delegates and reviews; members work in their own sessions.',
        teamAssignmentsTitle: 'Recent delegations',
        teamNoAssignments: 'No delegations yet',
        teamFilterAll: 'All',
        teamFilterRunning: 'Running',
        teamFilterSuccess: 'Done',
        teamFilterFailed: 'Failed',
        teamLoadMore: 'Load more',
        teamLead: 'Lead',
        teamMember: 'Member',
        teamNoRoster: 'No teammates yet',
        meetingTitle: 'Daily stand-up',
        meetingHint: 'On the first DSH open of the day, everyone reports in the ☀️ stand-up group and the lead writes the minutes.',
        meetingEnabled: 'Automatic stand-up',
        meetingWeekdaysOnly: 'Schedule',
        meetingEveryDay: 'Every day',
        meetingWorkdays: 'Weekdays only',
        meetingOnlyWhenWork: 'Trigger',
        meetingAlways: 'Every day',
        meetingWhenWork: 'Only when there was work',
        meetingRunNow: 'Run now',
        meetingLastMinutes: 'Last minutes',
        meetingNoMinutes: 'No stand-up minutes yet.',
        openMeetingGroup: 'Open stand-up group',
        meetingHistory: 'Earlier minutes',
        meetingChars: '{n} chars',
        meetingExport: 'Export minutes',
        meetingExported: 'Minutes exported',
        meetingSearch: 'Search date or content',
        meetingNoMatch: 'No matching minutes',
        meetingSaved: 'Stand-up settings saved',
        meetingRunStarted: 'Stand-up started — check the group shortly',
        meetingFailed: 'Stand-up action failed',
        loadEarlier: 'Load earlier',
        noMoreHistory: 'No earlier messages',
        replyYou: 'You',
        replay: 'Replay',
        replayTitle: 'Conversation replay',
        replayEmpty: 'No messages to replay yet.',
        replayBot: 'Bot',
        replayPlay: 'Play',
        replayPause: 'Pause',
        replayStep: 'Replay position',
        problemTitle: 'That attempt did not finish',
        problemUnknown: 'The run stopped without a clear reason.',
        problemTried: 'Tried',
        problemRetry: 'Retry once',
        problemRephrase: 'Try another way',
        problemCopy: 'Copy diagnostics',
        problemCopyDone: 'Diagnostics copied',
        copyFailed: 'Copy failed',
        problemDetails: 'Technical details',
        problemPrompt: 'The previous task did not finish. First explain in plain language where it got stuck and why, then try a simpler approach; do not repeat the failed command.',
        modelMissing: 'No model connected',
        technicalDetails: 'Technical details (optional)',
        intentWebRead: 'Reading web content',
        intentWebOpen: 'Opening a web page',
        intentWebClick: 'Clicking a web control',
        intentWebType: 'Filling a web form',
        intentDisk: 'Checking disk space',
        intentProcess: 'Checking running programs',
        intentFile: 'Browsing files',
        intentWait: 'Waiting for the task',
        intentCommand: 'Running a local operation',
        intentImage: 'Looking at the screen',
        intentDelegate: 'Delegating to',
        intentHire: 'Hiring a specialist',
        intentSearch: 'Searching',
        updateAvailable: 'New version v{version} available',
        updateHint: 'Download the new build and restart DSH to apply it.',
        updateDownload: 'Download update',
        updateLater: 'Remind me later',
        theme: 'Theme',
        themeDark: 'Dark',
        themeWarm: 'Warm',
        themeInk: 'Ink',
        themeAurora: 'Mist',
        themeEmber: 'Clay',
        themeDarkHint: 'Ink-black · restrained contrast',
        themeWarmHint: 'Cream paper · terracotta',
        themeInkHint: 'Rice paper · ink and vermilion',
        themeMistHint: 'Cool fog · low-saturation seafoam',
        themeClayHint: 'Warm stone · apricot and clay',
        modelMissingHint: 'Connect an API and choose a default model in DSH settings before sending a task.',
        modelRetry: 'Retry',
        modelConnected: 'Model connected',
        quoteJump: 'Jump to the original message',
        quote: 'Quote',
        pinMessage: 'Pin',
        unpinMessage: 'Unpin',
        pinnedMessage: 'Pinned message',
        pinSaved: 'Pinned',
        unpinSaved: 'Unpinned',
        pinnedList: 'Pinned list',
        pinnedClearAll: 'Clear all pins',
        searchTitle: 'Search messages',
        searchPlaceholder: 'Search chats, memory, or type a command…',
        searchEmpty: 'No matching messages or memories',
        searchHint: 'Ctrl K opens the command center; type to search all chats and memory',
        commandTitle: 'Command center',
        searchNotLoaded: 'That message is in earlier history; load earlier first',
        searchScopeThread: 'This chat',
        searchScopeAll: 'All chats',
        exportThread: 'Export conversation',
        exported: 'Conversation exported',
        exportFailed: 'Export failed',
        pinsTitle: 'Pinned & saved',
        pinsEmpty: 'No pinned or saved messages yet',
        pinsRemove: 'Remove from saved',
        renameHint: 'Double-click to rename',
        renamed: 'Title updated',
        pin: 'Pin',
        unpin: 'Unpin',
        archive: 'Archive',
        unarchive: 'Unarchive',
        showArchived: 'Show archived ({n})',
        hideArchived: 'Hide archived',
        archived: 'Archived',
        unarchived: 'Unarchived',
        teamHint: 'Subagents spawned by the main bot show up here and work in parallel.',
        teamEmpty: 'No subagents running.',
        qualityTitle: 'Quality',
        runs: 'Runs',
        success: 'Success',
        failed: 'Failed',
        successRate: 'Success rate',
        verified: 'Verified',
        needsReview: 'Review',
        verifiedRate: 'Verified rate',
        verdictPassed: 'Pass',
        verdictReview: 'Review',
        verdictFailed: 'Fail',
        notify: 'Notify',
        notifyTitle: 'QQ notifications',
        notifyHint: 'Only sends when a task completes, fails or is interrupted; intermediate steps, watchdog and auto-continue do not send. SMTP uses a QQ Mail authorization code; desktop mode needs a logged-in QQ.',
        notifyEnabled: 'Enable notifications',
        notifyOn: 'On',
        notifyOff: 'Off',
        notifyRemoteControl: 'Allow QQ remote commands',
        notifyRemoteHint: 'Reads only the contact’s current chat window; supports /tasks, /use N, /status, /stop, /continue, /retry.',
        notifySuccessMode: 'Notify on',
        notifySuccessAll: 'Completion and interruption',
        notifySuccessFailures: 'Interruption/failure only',
        notifyQuietStart: 'Quiet start',
        notifyQuietEnd: 'Quiet end',
        notifyInterval: 'Minimum interval (seconds)',
        budgetTitle: 'Run budget',
        budgetHint: 'A run that exceeds any limit is checkpointed and stopped instead of running away unattended.',
        budgetMinutes: 'Max minutes',
        budgetTools: 'Max tool calls',
        budgetTokens: 'Max tokens',
        notifyMethod: 'Transport',
        notifySmtp: 'QQ Mail SMTP',
        notifyDesktop: 'QQ desktop',
        notifyEmail: 'QQ email',
        notifyAuth: 'SMTP authorization code',
        notifyTo: 'Recipient QQ email',
        notifyContact: 'QQ contact / group',
        notifySave: 'Save',
        notifyTest: 'Send test',
        notifySaved: 'Notification settings saved',
        notifyTested: 'Test message sent',
        notifyFailed: 'Notification failed',
        notifyStatus: 'Notification status',
        notifyNoSend: 'Nothing sent yet',
        lastSent: 'Last sent',
        safetyTitle: 'Safety / Undo',
        safetyEmpty: 'No destructive-operation snapshots yet.',
        snapshotFiles: 'paths',
        undoSnapshot: 'Undo',
        restored: 'restored',
        undoing: 'Undoing',
        undoDone: 'Snapshot restored',
        undoFailed: 'Undo failed',
        steps: 'steps',
        noRuns: 'No task history yet.',
        checkpointTitle: 'Last run was interrupted — resume from checkpoint',
        checkpointHint: 'Carries the goal, last action and error; no restart from scratch.',
        resume: 'Resume from checkpoint',
        resuming: 'Resuming',
        resumed: 'Resumed from checkpoint',
        skills: 'Skills',
        skillTitle: 'Skills',
        skillHint: 'Save a task as a skill when you want to reuse it; one-off prompts are no longer auto-added.',
        skillEmpty: 'No skills yet. Save one from a task card when you want to reuse it.',
        skillAuto: 'auto',
        skillUses: 'used',
        skillSuccessRate: 'success',
        params: 'params',
        skillRun: 'Run',
        skillDelete: 'Delete',
        skillSaveCurrent: 'Save current task as skill',
        skillSaved: 'Saved as skill',
        skillSaveFailed: 'Save skill failed',
        skillRunning: 'Started a new task from the skill',
        skillRunFailed: 'Run skill failed',
        skillDeleted: 'Skill deleted',
        bots: 'Bots',
        newBot: 'New bot',
        editBot: 'Bot settings',
        manageBots: 'Manage bots',
        botName: 'Name',
        botEmoji: 'Avatar',
        botTagline: 'Tagline',
        botPersona: 'Extra instructions',
        botPersonaHint: 'Applies only to this bot: role, tone, strengths, boundaries.',
        botPersonaPlaceholder: 'e.g. You are great at web research. Find evidence before concluding.',
        botPreset: 'Agent preset',
        botPresetAuto: 'Follow default',
        botModel: 'Model',
        botModelAuto: 'Follow default',
        botWorkspace: 'Workspace',
        botWorkspaceHint: 'Leave blank for the shared workspace. Must be an absolute path.',
        botPrivilege: 'Permission mode',
        botPrivilegeStandard: 'Standard (file sandbox)',
        botPrivilegeAdmin: 'Full access + Administrator',
        adminAckLabel: 'I understand administrator operations run directly and allow this bot to use administrator rights',
        adminConfirmRequired: 'Confirm the administrator warning before saving',
        botPrivilegeHint: 'Full access disables the DSH file sandbox and lets the bot run administrator commands through admin_exec.py. Enable only for bots you trust.',
        botAutonomy: 'Task mode',
        botAutonomyInteractive: 'Interactive (ask when needed)',
        botAutonomyUnattended: 'Unattended (no questions, model judgment)',
        botAutonomyHint: 'Unattended disables bot_ask and question endings; the bot proceeds with the most reasonable assumption and auto-continues at most 8 times. Use when you are away.',
        botMemoryHint: 'Each bot has its own long-term memory.',
        botDelete: 'Delete bot',
        botDeleteConfirm: 'Delete this bot with its tasks and routines? DSH history is kept.',
        botDefault: 'Default',
        botSave: 'Save',
        botSaving: 'Saving',
        botCreated: 'Bot created',
        botUpdated: 'Bot updated',
        privilegeLiveFailed: 'Permission saved, but the live session could not switch',
        botDeleted: 'Bot deleted',
        botNamePlaceholder: 'e.g. Scout',
        botNameRequired: 'Enter a bot name',
        botTaglinePlaceholder: 'e.g. Web and document research',
        botWorkspacePlaceholder: 'D:\\projects',
        catalogFailed: 'Could not read the catalog; enter the model manually',
        routines: 'Routines',
        routineTitle: 'Routines',
        routineHint: 'Give recurring work to the clock. Runs while DSH is open.',
        routineEmpty: 'No routines yet.',
        routineEmptyHint: 'Start with a template; time and content can be edited later.',
        routinePresetDailyTitle: 'Daily work summary',
        routinePresetDailyPrompt: 'Summarize today’s completed tasks, failed tasks, and what to watch tomorrow, in at most 5 bullet points.',
        routinePresetWeeklyTitle: 'Weekly file review',
        routinePresetWeeklyPrompt: 'Review files added or changed in the workspace this week; list important changes and temporary files to clean up.',
        routinePresetHourlyTitle: 'Hourly task check',
        routinePresetHourlyPrompt: 'Check running and recently failed tasks; if there are no issues, reply only “OK”.',
        routineNew: 'New routine',
        routineEdit: 'Edit routine',
        routineName: 'Name',
        routinePrompt: 'What to run',
        routinePromptPlaceholder: 'e.g. Scan the workspace and give me a one-line summary.',
        routineSchedule: 'Schedule',
        routineDaily: 'Daily',
        routineWeekly: 'Weekly',
        routineEvery: 'Every',
        routineCron: 'Cron',
        routineCronUnsupported: 'not supported yet',
        routineTime: 'Time',
        routineWeekdays: 'Weekdays',
        routineInterval: 'Interval',
        routineMinutes: 'minutes',
        routineHours: 'hours',
        routineExpression: 'Cron expression',
        routineEnabled: 'Active',
        routinePaused: 'Paused',
        routineRun: 'Run now',
        routineDelete: 'Delete routine',
        routineDeleteConfirm: 'Delete this routine? Finished tasks are kept.',
        routineCreate: 'Create',
        routineSave: 'Save',
        routineSaveRun: 'Save & run',
        routineSaved: 'Routine saved',
        routineDeleted: 'Routine deleted',
        routineRunning: 'Started',
        routineNext: 'Next',
        routineNoSchedule: 'Unscheduled',
        routineError: 'Routine action failed',
        routineNameRequired: 'Enter a name',
        routinePromptRequired: 'Enter what to run',
        routineEveryHint: 'At least one minute',
        dailyAt: 'Daily {time}',
        weeklyAt: 'Weekly {days} {time}',
        everyMinutes: 'Every {n} min',
        everyHours: 'Every {n} h',
        cronAt: 'Cron {expression}',
        lastRun: 'Last run {when}',
        neverRun: 'Never run',
        weekday1: 'Mon',
        weekday2: 'Tue',
        weekday3: 'Wed',
        weekday4: 'Thu',
        weekday5: 'Fri',
        weekday6: 'Sat',
        weekday7: 'Sun',
        botCount: '{n} bots',
        taskRoutine: 'Routine',
        memoryTitle: 'Long-term memory',
        memoryHint: 'DSH carries this page into every task. Write your preferences, project context, and recurring workflows.',
        saveMemory: 'Save memory',
        memorySaved: 'Memory saved',
        memoryEmpty: 'No memory yet.',
        stats: 'This task',
        turns: 'Turns',
        tools: 'Tools',
        tokens: 'Tokens',
        elapsed: 'Elapsed',
        model: 'Model',
        loading: 'Connecting to this machine…',
        backendDown: 'Backend not ready',
        backendHint: 'Make sure the plugin is enabled, then refresh the page.',
        reload: 'Retry',
        offlineBanner: 'Connection to DSH Bot was interrupted.',
        stopHint: 'Stop the current task',
        taskRunning: 'RUNNING',
        taskIdle: 'STANDBY',
        openComputer: 'Computer',
        closeComputer: 'Hide',
        memorySaveFailed: 'Save failed',
        sendFailed: 'Send failed',
        newTaskFailed: 'Could not create task',
        resetFailed: 'Rebuild failed',
        notifTitle: 'DSH is back',
        notifBody: 'The task is finished.',
        connectFailed: 'Screen capture failed',
        scrollBottom: 'Jump to latest',
        contextWindow: 'Context',
        memoryPath: 'Memory file',
        copiedPath: 'Path copied',
        sessionLabel: 'SESSION',
        localLabel: 'LOCAL',
        refresh: 'Refresh',
        lastUpdated: 'Updated',
        voiceOn: 'Voice on',
        voiceOff: 'Voice off',
        runLog: 'Run log',
        currentTool: 'Current tool',
        diskFree: 'free',
        appCount: '{n} windows',
        botStatus: 'Local agent',
        taskMenu: 'Task menu',
        confirm: 'Confirm',
        cancel: 'Cancel',
        close: 'Close',
        open: 'Open',
        collapse: 'Collapse',
        expand: 'Expand',
        noPreview: 'No preview',
        clickRefresh: 'Click to refresh',
        noScreen: 'Not connected',
        voice: 'Voice',
        fullAccess: 'Local access',
        adminMode: 'Administrator',
        adminModeHint: 'This bot has administrator rights and system-level operations run directly. Switch it back to Standard in the bot editor if needed.',
        system: 'System',
        host: 'Host',
        user: 'User',
        modelAuto: 'Auto',
        threadEmpty: 'No messages in this task yet.',
        steerHint: 'Sends into the current step',
        queueHint: 'Queues for the next turn',
        waitingFirst: 'Waiting for your first sentence',
        botOnline: 'Online',
        modelLabel: 'Model',
        apiError: 'Request failed',
        sessionReset: 'Session rebuilt',
        menu: 'Menu',
        sendHint: 'Ctrl / Cmd + Enter also sends',
        template: 'Templates',
        templateTitle: 'Task templates',
        templateHomework: 'Web homework',
        templateHomeworkPrompt: 'Do this web homework: <paste assignment URL>. Open it with python scripts/edge.py open <URL>, run read once to get all questions and controls, answer/fill them, submit, then read to confirm. Do not screenshot unless the page is canvas/PDF/image-only.',
        templateRead: 'Web digest',
        templateReadPrompt: 'Open <URL> and read the full page with edge.py read; scroll down and read again for long pages. Return 5 key points, key numbers, and source quotes. Do not screenshot.',
        templateCleanup: 'Disk cleanup',
        templateCleanupPrompt: 'Only inventory C: and E: for space, caches, old backups, recycle bin and duplicates. Output a cleanup list and estimated reclaim; delete nothing until I confirm.',
        templateReview: 'Daily review',
        templateReviewPrompt: 'Summarize the team runs from the last 24 hours: what completed, what failed or was interrupted, and next actions. Do not re-run tasks.',
        templateResearch: 'Deep research',
        templateResearchPrompt: 'Research <topic>: list 3 key questions, search at least 4 independent sources with web_search, cross-check and flag conflicts, then write a linked report to report/research-<date>.md with dates, conclusions and 5 actionable recommendations. Never invent sources.',
        templateWorkbench: 'Isolated workbench',
        templateWorkbenchPrompt: 'Run python scripts/sandbox.py status, create a workbench with create --name <task> [--copy <path>], then open --name <task>. Do experiments only inside that workbench and report the workspace/profile paths; do not touch the everyday browser profile.',
        templateOcr: 'Image / OCR',
        templateOcrPrompt: 'When a page/image has no usable control tree: capture the target window with python scripts/computer.py window-shot <title> <png>, then run python scripts/ocr.py window <title> --lang eng (use eng+chi_sim if installed); act on the OCR text. Do not default to full-screen screenshots.',
        templateCheckup: 'PC checkup',
        templateCheckupPrompt: 'Do a read-only PC checkup: python scripts/computer.py screen / windows, inspect disk free space, memory/CPU, startup entries and abnormal processes; write a data-backed report without deleting files or changing settings. If cleanup is needed, recommend and wait for confirmation.',
        templatePpt: 'Make a deck',
        templatePptPrompt: 'Build a real PPT about <topic>: confirm audience, slide count and theme (midnight/warm/mono/aurora/ember), then run python scripts/studio.py ppt --out <deck.pptx> --spec <spec.json>; spec needs title, subtitle, theme and slides (bullets/stats/quote/section). After generation only verify page count and that the file exists—do not inspect XML/fonts/shape geometry or hunt for LibreOffice. Return the path and per-slide points immediately.',
        templateDoc: 'Write a document',
        templateDocPrompt: 'Turn <topic/material> into a DOCX: prepare Markdown first, then run python scripts/studio.py doc --out <report.docx> --markdown <report.md>. Verify headings, tables and paragraphs; return the path and 3 revision suggestions.',
        templateSheet: 'Make a sheet',
        templateSheetPrompt: 'Turn <data/CSV> into a styled XLSX: prepare CSV/JSON, then run python scripts/studio.py sheet --out <data.xlsx> --csv <data.csv> --title <title>. Verify row count, header, number formats and chart; return the path and a short data summary.',
        templateGame: 'Make a game',
        templateGamePrompt: 'Build a playable single-file HTML game: run python scripts/studio.py game --out <game.html> --kind snake|memory|runner --title <title>, then open and verify it. Return controls and the path. Iterate on the generated file for levels/art/sound.',
        templateMusic: 'Make music',
        templateMusicPrompt: 'Generate local <style: lofi/upbeat/ambient> music: run python scripts/studio.py music --out <theme.wav> --style <style> --seconds <seconds> to produce WAV + MIDI. Return duration, BPM and path. State that it is local synthesis, not a cloud model; regenerate with new parameters for another arrangement.',
        templateVocational: 'Vocational course',
        templateVocationalPrompt: 'Open the vocational course page <URL>. Run python scripts/course.py progress first for completed/pending counts (fast cache; if cached:true, do not re-read), then course.py status for the phase. Use course.py play for video, ppt for slides, question for quiz text/options, answer --choice N --submit to answer, and next to advance. Action commands return page/phase/progress — reuse that result instead of running full status after every click; only run status --full when the page is missing, cache is stale, or you are stuck. If a click returns changed:false/stalled:true, do not repeat it: read --all, check iframes, scroll, wait-change, then stop and report the blocker. Stop immediately on exam/proctored/submit-exam pages.',
        attachment: 'Attachment',
        attachmentCopy: 'Copy path',
        attachmentCopied: 'Copied',
        attachmentPreview: 'Preview image',
        attachmentPrev: 'Previous image',
        attachmentNext: 'Next image',
        attachmentDownload: 'Download',
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        zoomReset: 'Reset zoom',
        attachmentImages: 'Images',
        attachmentPdfs: 'PDF',
        attachmentSheets: 'Sheets',
        attachmentCodeFiles: 'Code',
        attachmentFiles: 'Files',
        imageRefreshed: 'Preview refreshed',
        context: 'Context',
        thinkingDone: 'Thought',
        questionKicker: 'DECISION NEEDED',
        questionTitle: 'DSH is waiting for you',
        questionSubmit: 'Submit answer',
        questionSkip: 'Skip',
        questionOther: 'Other / custom',
        questionMulti: 'Select all that apply',
        questionHint: 'It will continue after you answer.',
        questionSubmitting: 'Submitting',
        approvalKicker: 'APPROVAL NEEDED',
        approvalTitle: 'The AI is waiting for your approval',
        approvalAllow: 'Allow once',
        approvalDeny: 'Reject',
        approvalReason: 'Reason',
        approvalHint: 'The AI is paused and will not continue; this decision applies to this call only.',
        approvalNativeKicker: 'DSH APPROVAL',
        approvalNativeTitle: 'DSH is waiting for approval',
        approvalNativeHint: 'The approval popup is in the DSH session list on the left; the Bot cannot answer it. Return to DSH to decide, or stop this task.',
        approvalNativeOpen: 'Return to DSH',
        approvalNativeManual: 'Click “New chat” at the top-left to return to DSH and handle the approval; do not refresh the page.',
        stoppedByUser: 'You stopped this turn',
        retryHint: 'Let DSH continue',
        offlineHint: 'Backend is not answering, retrying…',
        memoryPlaceholder: 'For example:\n- I work on Windows and use PowerShell\n- Projects live in D:\\projects\n- Reply in Chinese, skip the fluff',
        memoryHistory: 'Version history',
        memoryHistoryHint: 'Each save is a Git commit. Inspect the diff or roll back here.',
        memoryHistoryEmpty: 'No commits yet. Save once to create the first one.',
        memoryDiff: 'Diff',
        memoryRestore: 'Restore this version',
        memoryRestored: 'Restored to the selected version',
        memoryNoGit: 'Git is not available; memory still saves but without history.',
        memoryDirty: 'Uncommitted changes',
        tool_bash: 'Run command',
        tool_read: 'Read file',
        tool_write: 'Write file',
        tool_edit: 'Edit file',
        tool_glob: 'Scan files',
        tool_grep: 'Search content',
        tool_web_search: 'Search web',
        tool_web_fetch: 'Fetch page',
        tool_subagent: 'Spawn subagent',
        tool_workflow: 'Orchestrate',
        tool_present: 'Deliver files',
        tool_todo_write: 'Update plan',
        tool_create_goal: 'Set goal',
        tool_update_goal: 'Advance goal',
        tool_ask_user_question: 'Ask you',
        tool_bot_ask: 'Decision needed',
        tool_skill: 'Load skill',
        tool_read_image: 'View image',
        tool_job_output: 'Read job',
        tool_job_list: 'List jobs',
        tool_send_message: 'Message subagent',
        tool_terminal_open: 'Open terminal',
        tool_terminal_read: 'Read terminal',
        tool_run_code: 'Run code',
        tool_exit_plan_mode: 'Exit plan mode',
        tool_cordis_inspect_query: 'Inspect runtime',
        tool_schedule_create: 'Schedule task',
        tool_default: 'Run tool',
        group: 'Group',
        groups: 'Groups',
        newGroup: 'New group',
        editGroup: 'Group settings',
        groupName: 'Group name',
        groupNamePlaceholder: 'e.g. Growth review, Site launch',
        groupMembers: 'Members (at least 2)',
        groupCreate: 'Create group',
        groupSave: 'Save',
        groupSaving: 'Saving',
        groupDelete: 'Delete group',
        groupDeleteConfirm: 'Delete this group? Member sessions and their history will be removed.',
        groupMinMembers: 'Pick at least 2 members',
        groupHint: 'When not @-mentioned, use the routing below; @name sends only to that member.',
        groupRouting: 'Message routing',
        groupRoutingAll: 'Everyone: all members reply when not mentioned',
        groupRoutingLeader: 'Leader: leader handles first and can delegate',
        groupRoutingHint: 'Leader mode is quieter; use @all when you want a full discussion.',
        groupMembersCount: '{n} members',
        groupMentionAll: 'everyone',
        groupEmpty: 'No messages in this group yet',
        groupWelcome: 'Say something, @ whoever should answer.',
        groupCreated: 'Group created',
        groupUpdated: 'Group updated',
        groupDeleted: 'Group deleted',
        speaker: 'Member',
        atMember: '@ member',
        tool_bot_dispatch: 'Dispatch to member',
        role: 'Team role',
        roleMember: 'Member',
        roleLead: 'Lead (can delegate)',
        roleHint: 'The lead is the only bot you talk to; it delegates to members and receives their reports.',
        botEffort: 'Reasoning effort',
        botEffortAuto: 'Follow default',
        botEffortHint: 'All bots share the latest model; this only changes reasoning effort. Lead: max, members: high; low is not offered.',
        teamTemplate: 'Add specialist',
        teamTemplateConfirm: 'Create or refresh the team template? Adds Boss / Disk cleanup / University bots; existing edits are kept.',
        teamTemplateDone: 'Team is ready — just talk to the Boss',
        teamTemplateFailed: 'Could not set up the team',
        assignmentTo: 'Delegated to',
        assignmentRunning: 'Running',
        assignmentDone: 'Done',
        assignmentFailed: 'Failed',
        assignmentAborted: 'Aborted',
        assignmentSummary: 'Result',
        assignmentStats: '{steps} steps · {duration} · {tokens}',
        assignmentRetried: 'Delegation retried; its receipt will return here',
        assignmentRetryCount: 'Retry {n}',
        hireMember: 'New member',
      },
    }

    const TOOL_KEYS = {
      bash: 'tool_bash',
      pwsh: 'tool_bash',
      read: 'tool_read',
      write: 'tool_write',
      edit: 'tool_edit',
      glob: 'tool_glob',
      grep: 'tool_grep',
      web_search: 'tool_web_search',
      web_fetch: 'tool_web_fetch',
      subagent: 'tool_subagent',
      subagent_fork: 'tool_subagent',
      workflow: 'tool_workflow',
      present: 'tool_present',
      todo_write: 'tool_todo_write',
      create_goal: 'tool_create_goal',
      update_goal: 'tool_update_goal',
      ask_user_question: 'tool_ask_user_question',
      bot_ask: 'tool_bot_ask',
      skill: 'tool_skill',
      read_image: 'tool_read_image',
      job_output: 'tool_job_output',
      job_list: 'tool_job_list',
      send_message: 'tool_send_message',
      terminal_open: 'tool_terminal_open',
      terminal_read: 'tool_terminal_read',
      run_code: 'tool_run_code',
      exit_plan_mode: 'tool_exit_plan_mode',
      cordis_inspect_query: 'tool_cordis_inspect_query',
      schedule_create: 'tool_schedule_create',
    }

    const ICONS = {
      plus: ['M12 5v14', 'M5 12h14'],
      send: ['M12 19V5', 'm5 12 7-7 7 7'],
      stop: ['M7 7h10v10H7z'],
      computer: ['M4 5h16v11H4z', 'M9 20h6', 'M12 16v4'],
      activity: ['M3 12h4l2 6 4-14 2 8h6'],
      play: ['M8 5v14l11-7z'],
      brain: ['M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-1 5.8V15a3 3 0 0 0 3 3h1V4z', 'M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 1 5.8V15a3 3 0 0 1-3 3h-1V4z'],
      trash: ['M4 7h16', 'M9 7V4h6v3', 'M7 7l1 13h8l1-13', 'M10 11v5', 'M14 11v5'],
      close: ['M6 6l12 12', 'M18 6 6 18'],
      copy: ['M9 9h10v10H9z', 'M5 15V5h10'],
      speaker: ['M4 10v4h4l5 4V6l-5 4H4z', 'M17 9a4 4 0 0 1 0 6', 'M20 6a8 8 0 0 1 0 12'],
      speakerOff: ['M4 10v4h4l5 4V6l-5 4H4z', 'M17 9l4 4', 'M21 9l-4 4'],
      chevronDown: ['m6 9 6 6 6-6'],
      chevronRight: ['m9 6 6 6-6 6'],
      chevronLeft: ['m15 6-6 6 6 6'],
      arrowUp: ['M12 19V5', 'm5 12 7-7 7 7'],
      quote: ['M9 14 4 9l5-5', 'M4 9h9a7 7 0 0 1 7 7v2'],
      search: ['M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'm16 16 5 5'],
      pin: ['M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5z', 'M12 14v6'],
      refresh: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 5v6h-6'],
      spark: ['M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z'],
      terminal: ['M4 5h16v14H4z', 'm7 9 3 3-3 3', 'M13 15h4'],
      file: ['M6 3h8l4 4v14H6z', 'M14 3v5h5'],
      image: ['M4 4h16v16H4z', 'm4 16 5-5 4 4 3-3 4 4', 'M15 8h.01'],
      pdf: ['M6 3h8l4 4v14H6z', 'M14 3v5h5', 'M9 14h6', 'M9 17h4'],
      sheet: ['M4 4h16v16H4z', 'M4 10h16', 'M10 4v16'],
      code: ['m9 8-4 4 4 4', 'm15 8 4 4-4 4'],
      globe: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18', 'M3 12h18', 'M12 3c3 3.5 3 14 0 18', 'M12 3c-3 3.5-3 14 0 18'],
      agents: ['M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M17 14a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', 'M3 20c0-3 2.2-5 5-5s5 2 5 5', 'M14 20c0-2.2 1.3-4 3-4s3 1.4 3 5'],
      check: ['m5 13 4 4L19 7'],
      alert: ['M12 4 3 20h18L12 4z', 'M12 10v4', 'M12 17h.01'],
      clock: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18', 'M12 7v5l3 2'],
      pencil: ['M4 20h4L20 8l-4-4L4 16v4z', 'M14 6l4 4'],
      folder: ['M3 6h7l2 2h9v11H3z'],
      menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
      arrowDown: ['M12 5v14', 'm5 12 7 7 7-7'],
      dots: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
      paperclip: ['M9 12l6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l7-7'],
      mic: ['M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z', 'M5 11a7 7 0 0 0 14 0', 'M12 18v3'],
      sparkles: ['M12 3l1.5 5L19 9.5 13.5 11 12 16l-1.5-5L5 9.5 10.5 8 12 3z', 'M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z'],
      help: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18', 'M9.5 9a2.5 2.5 0 1 1 4.3 1.7c-.8.7-1.8 1.2-1.8 2.8', 'M12 17h.01'],
    }

    function Icon({ name, size = 18, strokeWidth = 1.6 }) {
      const paths = ICONS[name] || ICONS.dots
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        paths.map((d, index) => h('path', { key: index, d })),
      )
    }

    function Orb({ size = 48, working = false, className = '' }) {
      return h(
        'span',
        {
          className: `gb-orb${working ? ' is-working' : ''}${className ? ` ${className}` : ''}`,
          style: { '--gb-orb-size': `${size}px` },
          'aria-hidden': true,
        },
        h('span', { className: 'gb-orb-halo' }),
        h('span', { className: 'gb-orb-sphere' }),
        h('span', { className: 'gb-orb-slit' }),
      )
    }

    function Gooey({ children, className = '' }) {
      return h('div', { className: `gb-gooey ${className}`.trim() }, children)
    }

    function interpolate(template, params) {
      if (!params) return template
      return String(template).replace(/\{(\w+)\}/g, (_, key) =>
        params[key] === undefined || params[key] === null ? '' : String(params[key]),
      )
    }

    function translate(ctx, key, params) {
      let value = null
      try {
        const bound = ctx.locale.bind(NS)
        value = bound(key, params)
      } catch {
        value = null
      }
      if (!value || value === key) {
        let locale = 'zh'
        try {
          const snapshot = ctx.locale.getLocale()
          locale = snapshot?.id || snapshot?.locale || 'zh'
        } catch {
          locale = 'zh'
        }
        value = COPY[locale]?.[key] || COPY.zh[key] || COPY.en[key] || key
      }
      return interpolate(value, params)
    }

    function useLocaleTick(ctx) {
      const [tick, setTick] = useState(0)
      useEffect(() => {
        let off = null
        try {
          off = ctx.locale.subscribe(() => setTick((value) => value + 1))
        } catch {
          off = null
        }
        return () => {
          try {
            off?.()
          } catch {
            /* ignore */
          }
        }
      }, [ctx])
      return tick
    }

    async function apiRequest(path, init) {
      const options = {
        credentials: 'same-origin',
        ...init,
        headers: {
          'x-dsh-bot-client': '1',
          ...(init?.body ? { 'content-type': 'application/json' } : {}),
          ...(init?.headers || {}),
        },
      }
      const response = await fetch(`${API_BASE}${path}`, options)
      const text = await response.text()
      let data = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = null
      }
      if (!response.ok || !data || data.ok === false) {
        throw new Error(data?.error || `HTTP ${response.status}`)
      }
      return data
    }

    const apiGet = (path) => apiRequest(path, { method: 'GET' })
    const apiPost = (path, body) =>
      apiRequest(path, { method: 'POST', body: JSON.stringify(body || {}) })

    function formatClock(value) {
      if (!value) return ''
      const date = new Date(value)
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    function formatRelative(value, t) {
      const seconds = Math.max(0, Math.round((Date.now() - Number(value || 0)) / 1000))
      if (seconds < 60) return t('justNow')
      const minutes = Math.round(seconds / 60)
      if (minutes < 60) return t('minutesAgo', { n: minutes })
      const hours = Math.round(minutes / 60)
      if (hours < 24) return t('hoursAgo', { n: hours })
      const days = Math.round(hours / 24)
      return t('daysAgo', { n: days })
    }

    function formatDuration(ms) {
      const value = Math.max(0, Number(ms) || 0)
      if (value < 1000) return `${Math.round(value)}ms`
      if (value < 60_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}s`
      const minutes = Math.floor(value / 60_000)
      const seconds = Math.round((value % 60_000) / 1000)
      return `${minutes}m ${String(seconds).padStart(2, '0')}s`
    }

    function formatBytes(bytes) {
      const value = Math.max(0, Number(bytes) || 0)
      if (value < 1024) return `${value} B`
      const units = ['KB', 'MB', 'GB', 'TB']
      let size = value / 1024
      let index = 0
      while (size >= 1024 && index < units.length - 1) {
        size /= 1024
        index += 1
      }
      return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[index]}`
    }

    function formatTokens(value) {
      const n = Number(value) || 0
      if (n < 1000) return String(n)
      if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`
      return `${(n / 1_000_000).toFixed(1)}m`
    }

    function truncateText(value, limit) {
      const text = String(value || '')
      return text.length > limit ? `${text.slice(0, limit)}…` : text
    }

    function snippetAround(value, query, limit = 180) {
      const text = String(value || '')
      const needle = String(query || '').trim().toLowerCase()
      const index = needle ? text.toLowerCase().indexOf(needle) : -1
      if (index < 0) return truncateText(text, limit)
      const start = Math.max(0, index - 60)
      const end = Math.min(text.length, start + limit)
      return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
    }

    function highlightText(value, query) {
      const text = String(value || '')
      const needle = String(query || '').trim()
      if (!needle) return text
      const lower = text.toLowerCase()
      const target = needle.toLowerCase()
      const parts = []
      let cursor = 0
      let index = lower.indexOf(target)
      let key = 0
      while (index >= 0) {
        if (index > cursor) parts.push(text.slice(cursor, index))
        parts.push(h('mark', { key: `mark-${key}` }, text.slice(index, index + needle.length)))
        key += 1
        cursor = index + needle.length
        index = lower.indexOf(target, cursor)
      }
      if (cursor < text.length) parts.push(text.slice(cursor))
      return parts
    }

    function baseName(value) {
      if (typeof value !== 'string') return ''
      const parts = value.split(/[\\/]/)
      return parts[parts.length - 1] || value
    }

    function firstLine(value) {
      return String(value || '').split('\n')[0].slice(0, 120)
    }

    function toolLabel(name, t) {
      return t(TOOL_KEYS[name] || 'tool_default')
    }

    function toolTarget(name, args, t) {
      if (!args || typeof args !== 'object') return ''
      if (args.command) return firstLine(args.command)
      if (args.file_path) return baseName(args.file_path)
      if (args.path) return baseName(args.path)
      if (args.query) return truncateText(args.query, 80)
      if (args.url) {
        try {
          return new URL(args.url).host
        } catch {
          return truncateText(args.url, 80)
        }
      }
      if (args.description) return truncateText(args.description, 80)
      if (args.prompt) return truncateText(args.prompt, 80)
      if (args.text) return truncateText(args.text, 80)
      return ''
    }

    function toolIntent(item, t) {
      const name = item?.name || ''
      const args = item?.args || {}
      const command = String(args.command || args.code || '')
      if (name === 'bot_delegate' || name === 'bot_dispatch') {
        const target = String(args.bot || '').trim()
        return target ? `${t('intentDelegate')} ${target}` : t('intentDelegate')
      }
      if (name === 'bot_hire') return t('intentHire')
      if (name === 'read_image') return t('intentImage')
      if (name === 'web_search') {
        const query = String(args.query || '').trim()
        return query ? `${t('intentSearch')}：${truncateText(query, 40)}` : t('intentSearch')
      }
      if (name === 'web_fetch') return t('intentWebRead')
      if (name === 'bash' || name === 'run_code' || name === 'pwsh') {
        if (/edge\.py["'\s]+read/i.test(command)) return t('intentWebRead')
        if (/edge\.py["'\s]+open|edge\.py["'\s]+navigate/i.test(command)) return t('intentWebOpen')
        if (/edge\.py["'\s]+click/i.test(command)) return t('intentWebClick')
        if (/edge\.py["'\s]+type|edge\.py["'\s]+select/i.test(command)) return t('intentWebType')
        if (/Get-(PSDrive|Volume)|wmic\s+logicaldisk|df\s+-h|diskpart/i.test(command)) return t('intentDisk')
        if (/Get-Process|tasklist|ps\s+aux/i.test(command)) return t('intentProcess')
        if (/Get-ChildItem|\bdir\b|\bls\b|Get-Item/i.test(command)) return t('intentFile')
        if (/Start-Sleep|sleep\s+\d/i.test(command)) return t('intentWait')
        return t('intentCommand')
      }
      if (name === 'read' || name === 'write' || name === 'edit' || name === 'glob' || name === 'grep') {
        return t(`tool_${name}`)
      }
      return toolLabel(name, t)
    }

    async function copyText(text) {
      try {
        await navigator.clipboard.writeText(String(text))
        return true
      } catch {
        try {
          const area = document.createElement('textarea')
          area.value = String(text)
          area.style.position = 'fixed'
          area.style.opacity = '0'
          document.body.appendChild(area)
          area.select()
          document.execCommand('copy')
          document.body.removeChild(area)
          return true
        } catch {
          return false
        }
      }
    }

    function speakText(text, t) {
      if (!('speechSynthesis' in window)) return
      const clean = String(text || '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/[#*_`>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 900)
      if (!clean) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(clean)
      const chinese = /[\u3400-\u9fff]/.test(clean)
      utterance.lang = chinese ? 'zh-CN' : 'en-US'
      utterance.rate = 1.04
      utterance.pitch = 0.96
      try {
        const voices = window.speechSynthesis.getVoices()
        const match = voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith(chinese ? 'zh' : 'en'))
        if (match) utterance.voice = match
      } catch {
        /* voice list is optional */
      }
      window.speechSynthesis.speak(utterance)
    }

    function splitTableRow(line) {
      return String(line || '')
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim())
    }

    function parseMarkdown(text) {
      const lines = String(text || '').split('\n')
      const blocks = []
      let index = 0
      while (index < lines.length) {
        const line = lines[index]
        if (/^\s*```/.test(line)) {
          const lang = line.replace(/^\s*```/, '').trim()
          index += 1
          const code = []
          while (index < lines.length && !/^\s*```/.test(lines[index])) {
            code.push(lines[index])
            index += 1
          }
          index += 1
          blocks.push({ type: 'code', lang, code: code.join('\n') })
          continue
        }
        if (!line.trim()) {
          index += 1
          continue
        }
        if (
          /^\s*\|.*\|\s*$/.test(line) &&
          index + 1 < lines.length &&
          /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[index + 1])
        ) {
          const header = splitTableRow(line)
          const rows = []
          index += 2
          while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
            rows.push(splitTableRow(lines[index]))
            index += 1
          }
          blocks.push({ type: 'table', header, rows })
          continue
        }
        const heading = /^(#{1,3})\s+(.*)$/.exec(line)
        if (heading) {
          blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
          index += 1
          continue
        }
        if (/^\s*附件[：:]\s*$/.test(line)) {
          const items = []
          let cursor = index + 1
          while (cursor < lines.length) {
            const match = /^\s*[-*]\s*\[([^\]]+)\]\(<([^>]+)>\)\s*$/.exec(lines[cursor])
            if (!match) break
            items.push({ name: match[1], path: match[2] })
            cursor += 1
          }
          if (items.length > 0) {
            blocks.push({ type: 'attachments', items })
            index = cursor
            continue
          }
        }
        if (/^\s*[-*]\s+/.test(line)) {
          const items = []
          while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
            items.push(lines[index].replace(/^\s*[-*]\s+/, ''))
            index += 1
          }
          blocks.push({ type: 'ul', items })
          continue
        }
        if (/^\s*\d+\.\s+/.test(line)) {
          const items = []
          while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
            items.push(lines[index].replace(/^\s*\d+\.\s+/, ''))
            index += 1
          }
          blocks.push({ type: 'ol', items })
          continue
        }
        if (/^\s*>\s?/.test(line)) {
          const items = []
          while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
            items.push(lines[index].replace(/^\s*>\s?/, ''))
            index += 1
          }
          blocks.push({ type: 'quote', items })
          continue
        }
        const paragraph = []
        while (
          index < lines.length &&
          lines[index].trim() &&
          !/^\s*(```|#{1,3}\s|[-*]\s|\d+\.\s|>\s?|\|)/.test(lines[index])
        ) {
          paragraph.push(lines[index])
          index += 1
        }
        if (paragraph.length === 0) {
          paragraph.push(lines[index])
          index += 1
        }
        blocks.push({ type: 'p', text: paragraph.join('\n') })
      }
      return blocks
    }

    function renderInline(text, keyPrefix) {
      const value = String(text || '')
      const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
      const parts = []
      let last = 0
      let match
      let index = 0
      while ((match = pattern.exec(value)) !== null) {
        if (match.index > last) parts.push(value.slice(last, match.index))
        const token = match[0]
        if (token.startsWith('`')) {
          parts.push(h('code', { key: `${keyPrefix}-c-${index}`, className: 'gb-inline-code' }, token.slice(1, -1)))
        } else if (token.startsWith('**')) {
          parts.push(h('strong', { key: `${keyPrefix}-b-${index}` }, token.slice(2, -2)))
        } else {
          const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(token)
          parts.push(
            h(
              'a',
              {
                key: `${keyPrefix}-a-${index}`,
                href: link ? link[2] : '#',
                target: '_blank',
                rel: 'noreferrer noopener',
                className: 'gb-link',
              },
              link ? link[1] : token,
            ),
          )
        }
        last = match.index + token.length
        index += 1
      }
      if (last < value.length) parts.push(value.slice(last))
      return parts.length > 0 ? parts : [value]
    }

    function CodeBlock({ code, lang, t }) {
      const [copied, setCopied] = useState(false)
      const onCopy = async () => {
        const ok = await copyText(code)
        if (ok) {
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        }
      }
      return h(
        'div',
        { className: 'gb-codeblock' },
        h(
          'div',
          { className: 'gb-codeblock-head' },
          h('span', null, lang || 'code'),
          h(
            'button',
            { type: 'button', className: 'gb-code-copy', onClick: onCopy, title: t('copy') },
            h(Icon, { name: 'copy', size: 13 }),
            h('span', null, copied ? t('copied') : t('copy')),
          ),
        ),
        h('pre', null, h('code', null, code)),
      )
    }

    function EmptyState({ icon = 'file', title, hint, children, className = '' }) {
      return h(
        'div',
        { className: `gb-team-empty${className ? ` ${className}` : ''}` },
        h(Icon, { name: icon, size: 22 }),
        title ? h('b', { className: 'gb-empty-title' }, title) : null,
        hint ? h('span', { className: 'gb-empty-hint' }, hint) : null,
        children || null,
      )
    }

    function attachmentKind(name) {
      const extension = String(name || '').split('.').pop().toLowerCase()
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension)) return 'image'
      if (extension === 'pdf') return 'pdf'
      if (['xls', 'xlsx', 'csv'].includes(extension)) return 'sheet'
      if (['js', 'jsx', 'ts', 'tsx', 'py', 'json', 'html', 'css', 'sh'].includes(extension)) return 'code'
      return 'file'
    }

    function attachmentIcon(name) {
      return attachmentKind(name)
    }

    function AttachmentCards({ items, t }) {
      const [copied, setCopied] = useState('')
      const [previewIndex, setPreviewIndex] = useState(-1)
      const [zoom, setZoom] = useState(1)
      const [pan, setPan] = useState({ x: 0, y: 0 })
      const dragRef = useRef(null)
      const closeRef = useRef(null)
      const imageItems = items.filter((item) => {
        const fileName = String(item.path || '').split(/[\\/]/).pop() || item.name
        return attachmentKind(fileName) === 'image'
      })
      const preview = previewIndex >= 0 ? imageItems[previewIndex] || null : null
      const copy = async (item) => {
        const ok = await copyText(item.path)
        if (!ok) return
        setCopied(item.path)
        window.setTimeout(() => setCopied(''), 1400)
      }
      const changeZoom = (delta) => {
        setZoom((value) => {
          const next = Math.max(1, Math.min(4, Math.round((value + delta) * 100) / 100))
          if (next <= 1) setPan({ x: 0, y: 0 })
          return next
        })
      }
      useEffect(() => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
      }, [previewIndex])
      useEffect(() => {
        if (!preview) return undefined
        const onKey = (event) => {
          if (event.key === 'Escape') setPreviewIndex(-1)
          if (event.key === 'ArrowLeft' && imageItems.length > 1) {
            event.preventDefault()
            setPreviewIndex((index) => (index - 1 + imageItems.length) % imageItems.length)
          }
          if (event.key === 'ArrowRight' && imageItems.length > 1) {
            event.preventDefault()
            setPreviewIndex((index) => (index + 1) % imageItems.length)
          }
          if (event.key === '+' || event.key === '=') changeZoom(0.25)
          if (event.key === '-') changeZoom(-0.25)
          if (event.key === '0') {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }
        }
        window.addEventListener('keydown', onKey)
        closeRef.current?.focus?.()
        return () => window.removeEventListener('keydown', onKey)
      }, [Boolean(preview), imageItems.length])
      const movePreview = (delta) => {
        if (imageItems.length < 2) return
        setPreviewIndex((index) => (index + delta + imageItems.length) % imageItems.length)
      }
      const renderPreview = () => {
        if (!preview) return null
        const fileName = String(preview.path || '').split(/[\\/]/).pop() || preview.name
        const dialog = h(
          'div',
          {
            className: 'gb-attachment-lightbox',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': preview.name,
            onMouseDown: (event) => {
              if (event.target === event.currentTarget) setPreviewIndex(-1)
            },
          },
          h(
            'span',
            { className: 'gb-attachment-lightbox-count' },
            `${previewIndex + 1} / ${imageItems.length}`,
          ),
          imageItems.length > 1
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'gb-attachment-lightbox-nav is-prev',
                  onClick: (event) => {
                    event.stopPropagation()
                    movePreview(-1)
                  },
                  'aria-label': t('attachmentPrev'),
                },
                h(Icon, { name: 'chevronLeft', size: 22 }),
              )
            : null,
          imageItems.length > 1
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'gb-attachment-lightbox-nav is-next',
                  onClick: (event) => {
                    event.stopPropagation()
                    movePreview(1)
                  },
                  'aria-label': t('attachmentNext'),
                },
                h(Icon, { name: 'chevronRight', size: 22 }),
              )
            : null,
          h(
            'div',
            { className: 'gb-attachment-lightbox-zoom' },
            h(
              'button',
              { type: 'button', onClick: () => changeZoom(-0.25), 'aria-label': t('zoomOut') },
              '−',
            ),
            h('span', null, `${Math.round(zoom * 100)}%`),
            h(
              'button',
              { type: 'button', onClick: () => changeZoom(0.25), 'aria-label': t('zoomIn') },
              '+',
            ),
            h(
              'button',
              {
                type: 'button',
                onClick: () => {
                  setZoom(1)
                  setPan({ x: 0, y: 0 })
                },
                'aria-label': t('zoomReset'),
              },
              t('zoomReset'),
            ),
          ),
          h(
            'div',
            {
              className: `gb-attachment-lightbox-stage${zoom > 1 ? ' is-zoomed' : ''}`,
              onPointerDown: (event) => {
                if (zoom <= 1) return
                event.currentTarget.setPointerCapture?.(event.pointerId)
                dragRef.current = { x: event.clientX - pan.x, y: event.clientY - pan.y }
              },
              onPointerMove: (event) => {
                if (!dragRef.current) return
                setPan({
                  x: event.clientX - dragRef.current.x,
                  y: event.clientY - dragRef.current.y,
                })
              },
              onPointerUp: () => {
                dragRef.current = null
              },
              onPointerCancel: () => {
                dragRef.current = null
              },
              onWheel: (event) => {
                event.preventDefault()
                changeZoom(event.deltaY < 0 ? 0.2 : -0.2)
              },
            },
            h('img', {
              key: fileName,
              src: `${API_BASE}/file?name=${encodeURIComponent(fileName)}`,
              alt: preview.name,
              draggable: false,
              style: { transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` },
              onClick: (event) => event.stopPropagation(),
              onDoubleClick: (event) => {
                event.stopPropagation()
                if (zoom > 1) {
                  setZoom(1)
                  setPan({ x: 0, y: 0 })
                } else {
                  setZoom(2)
                }
              },
            }),
          ),
          h(
            'a',
            {
              className: 'gb-attachment-lightbox-download',
              href: `${API_BASE}/file?name=${encodeURIComponent(fileName)}&download=1`,
              download: preview.name,
              onClick: (event) => event.stopPropagation(),
              'aria-label': `${t('attachmentDownload')}: ${preview.name}`,
            },
            h(Icon, { name: 'arrowDown', size: 15 }),
            h('span', null, t('attachmentDownload')),
          ),
          h(
            'button',
            {
              type: 'button',
              ref: closeRef,
              className: 'gb-attachment-lightbox-close',
              onClick: () => setPreviewIndex(-1),
              'aria-label': t('close'),
            },
            h(Icon, { name: 'close', size: 18 }),
            h('span', null, t('close')),
          ),
        )
        // Render at document.body so a transformed message bubble cannot trap
        // the fixed overlay inside the chat column.
        return ReactDOM?.createPortal ? ReactDOM.createPortal(dialog, document.body) : dialog
      }
      const attachmentGroups = ['image', 'pdf', 'sheet', 'code', 'file']
        .map((kind) => ({
          kind,
          label:
            {
              image: 'attachmentImages',
              pdf: 'attachmentPdfs',
              sheet: 'attachmentSheets',
              code: 'attachmentCodeFiles',
              file: 'attachmentFiles',
            }[kind],
          items: items.filter((item) => {
            const fileName = String(item.path || '').split(/[\\/]/).pop() || item.name
            return attachmentKind(fileName) === kind
          }),
        }))
        .filter((group) => group.items.length > 0)
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'gb-attachments' },
          attachmentGroups.map((group) =>
            h(
              'div',
              { className: 'gb-attachment-group', key: group.kind },
              attachmentGroups.length > 1
                ? h('span', { className: 'gb-attachment-group-label' }, `${t(group.label)} · ${group.items.length}`)
                : null,
              h(
                'div',
                { className: 'gb-attachment-group-row' },
                group.items.map((item, index) =>
                  (() => {
                    const fileName = String(item.path || '').split(/[\\/]/).pop() || item.name
                    const isImage = attachmentKind(fileName) === 'image'
                    return h(
                      'div',
                      { key: `${item.path}-${index}`, className: 'gb-attachment', title: item.path },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'gb-attachment-main',
                          'aria-label': isImage ? `${t('attachmentPreview')}: ${item.name}` : `${t('attachmentCopy')}: ${item.name}`,
                          onClick: () => {
                            if (!isImage) {
                              copy(item)
                              return
                            }
                            const imageIndex = imageItems.findIndex((image) => image.path === item.path)
                            setPreviewIndex(imageIndex >= 0 ? imageIndex : 0)
                          },
                        },
                        isImage
                          ? h('img', {
                              className: 'gb-attachment-thumb',
                              src: `${API_BASE}/file?name=${encodeURIComponent(fileName)}`,
                              alt: '',
                              loading: 'lazy',
                            })
                          : h(Icon, { name: attachmentIcon(fileName), size: 12 }),
                        h('span', { className: 'gb-attachment-name' }, item.name),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'gb-attachment-copy',
                          onClick: () => copy(item),
                          title: copied === item.path ? t('attachmentCopied') : t('attachmentCopy'),
                          'aria-label': copied === item.path ? t('attachmentCopied') : t('attachmentCopy'),
                        },
                        h(Icon, { name: copied === item.path ? 'check' : 'copy', size: 11 }),
                      ),
                    )
                  })(),
                ),
              ),
            ),
          ),
        ),
        renderPreview(),
      )
    }

    function Markdown({ text, t }) {
      const blocks = useMemo(() => parseMarkdown(text), [text])
      return h(
        'div',
        { className: 'gb-md' },
        blocks.map((block, index) => {
          if (block.type === 'code') {
            return h(CodeBlock, { key: index, code: block.code, lang: block.lang, t })
          }
          if (block.type === 'attachments') {
            return h(AttachmentCards, { key: index, items: block.items, t })
          }
          if (block.type === 'heading') {
            const tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3'
            return h(tag, { key: index, className: 'gb-md-heading' }, renderInline(block.text, `h${index}`))
          }
          if (block.type === 'table') {
            return h(
              'div',
              { key: index, className: 'gb-md-table-wrap' },
              h(
                'table',
                { className: 'gb-md-table' },
                h(
                  'thead',
                  null,
                  h(
                    'tr',
                    null,
                    block.header.map((cell, cellIndex) =>
                      h('th', { key: cellIndex }, renderInline(cell, `th${index}-${cellIndex}`)),
                    ),
                  ),
                ),
                h(
                  'tbody',
                  null,
                  block.rows.map((row, rowIndex) =>
                    h(
                      'tr',
                      { key: rowIndex },
                      row.map((cell, cellIndex) =>
                        h('td', { key: cellIndex }, renderInline(cell, `td${index}-${rowIndex}-${cellIndex}`)),
                      ),
                    ),
                  ),
                ),
              ),
            )
          }
          if (block.type === 'ul' || block.type === 'ol') {
            return h(
              block.type,
              { key: index, className: 'gb-md-list' },
              block.items.map((item, itemIndex) =>
                h('li', { key: itemIndex }, renderInline(item, `li${index}-${itemIndex}`)),
              ),
            )
          }
          if (block.type === 'quote') {
            return h(
              'blockquote',
              { key: index, className: 'gb-md-quote' },
              block.items.map((item, itemIndex) =>
                h('p', { key: itemIndex }, renderInline(item, `q${index}-${itemIndex}`)),
              ),
            )
          }
          return h('p', { key: index }, renderInline(block.text, `p${index}`))
        }),
      )
    }

    function StatusDot({ running, idle = false }) {
      return h('span', {
        className: `gb-status-dot${running ? ' is-running' : ''}${idle ? ' is-idle' : ''}`,
        'aria-hidden': true,
      })
    }

    function Spinner({ size = 14 }) {
      return h('span', { className: 'gb-spinner', style: { width: size, height: size }, 'aria-hidden': true })
    }

    function AssistantMessage({ item, t, onSpeak, onQuote, onPin, pinned, voice, hideReasoning = false }) {
      const [showReasoning, setShowReasoning] = useState(false)
      const [copied, setCopied] = useState(false)
      const reasoning = item.reasoning || ''
      const text = item.text || ''
      const speaker = item.speaker || null
      const onCopy = async () => {
        const ok = await copyText(text)
        if (ok) {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }
      }
      const jumpToQuote = () => {
        if (!item.quote?.id) return
        const target = document.getElementById(`gb-msg-${item.quote.id}`)
        if (!target) return
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        target.classList.add('is-flash')
        setTimeout(() => target.classList.remove('is-flash'), 1400)
      }
      return h(
        'article',
        { className: `gb-assistant${item.streaming ? ' is-streaming' : ''}`, id: item.id ? `gb-msg-${item.id}` : undefined },
        h(
          'div',
          { className: `gb-assistant-avatar${speaker ? ' is-member' : ''}` },
          speaker
            ? h('span', { className: 'gb-member-avatar' }, speaker.emoji || '◉')
            : h(Orb, { size: 26, working: Boolean(item.streaming) }),
        ),
        h(
          'div',
          { className: 'gb-assistant-body' },
          h(
            'div',
            { className: 'gb-assistant-head' },
            h('span', { className: 'gb-author' }, speaker ? `${speaker.name}` : 'DSH'),
            h('span', { className: 'gb-sep' }, '·'),
            h('span', { className: 'gb-time' }, item.streaming ? t('working') : formatClock(item.time)),
            item.model ? h('span', { className: 'gb-model-tag' }, item.model.replace('deepseek-', 'DS ').replace('mimo-', 'MiMo ').toUpperCase()) : null,
          ),
          reasoning && !hideReasoning
            ? h(
                'div',
                { className: 'gb-reasoning' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'gb-reasoning-toggle',
                    onClick: () => setShowReasoning((value) => !value),
                    'aria-expanded': showReasoning,
                  },
                  h(Icon, { name: showReasoning ? 'chevronDown' : 'chevronRight', size: 13 }),
                  h('span', null, showReasoning ? t('reasoningHide') : t('reasoning')),
                  h('span', { className: 'gb-reasoning-count' }, `${reasoning.length} chars`),
                ),
                showReasoning
                  ? h('div', { className: 'gb-reasoning-body' }, reasoning.split('\n').map((line, index) => h('p', { key: index }, line)))
                  : null,
              )
            : null,
          item.quote
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'gb-quote',
                  onClick: jumpToQuote,
                  title: t('quoteJump'),
                },
                h(
                  'span',
                  { className: 'gb-quote-author' },
                  item.quote.name ? `@${item.quote.name}` : t('replyYou'),
                ),
                h('p', null, item.quote.text),
              )
            : null,
          text
            ? h(Markdown, { text, t })
            : item.streaming
              ? h(
                  'div',
                  { className: 'gb-typing' },
                  h('span', null),
                  h('span', null),
                  h('span', null),
                )
              : null,
          item.streaming && text
            ? h('span', { className: 'gb-cursor', 'aria-hidden': true })
            : null,
          h(
            'div',
            { className: 'gb-message-tools' },
            text
              ? h(
                  'button',
                  { type: 'button', className: 'gb-ghost-btn', onClick: onCopy, title: t('copy') },
                  h(Icon, { name: 'copy', size: 13 }),
                  h('span', null, copied ? t('copied') : t('copy')),
                )
              : null,
            text
              ? h(
                  'button',
                  { type: 'button', className: 'gb-ghost-btn', onClick: () => onSpeak(text), title: t('speak') },
                  h(Icon, { name: voice ? 'speakerOff' : 'speaker', size: 13 }),
                  h('span', null, t('speak')),
                )
              : null,
            text && onQuote
              ? h(
                  'button',
                  { type: 'button', className: 'gb-ghost-btn', onClick: () => onQuote(item), title: t('quote') },
                  h(Icon, { name: 'quote', size: 13 }),
                  h('span', null, t('quote')),
                )
              : null,
            text && onPin
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'gb-ghost-btn',
                    onClick: () => onPin(item),
                    title: pinned ? t('unpinMessage') : t('pinMessage'),
                  },
                  h(Icon, { name: 'pin', size: 13 }),
                  h('span', null, pinned ? t('unpinMessage') : t('pinMessage')),
                )
              : null,
          ),
        ),
      )
    }

    function userAttachmentView(raw) {
      const text = String(raw || '')
      const lines = text.split('\n')
      const start = lines.findIndex((line) => /^\s*附件[：:]\s*$/.test(line))
      if (start < 0) return null
      const items = []
      for (let index = start + 1; index < lines.length; index += 1) {
        const match = /^\s*[-*]\s*\[([^\]]+)\]\(<([^>]+)>\)\s*$/.exec(lines[index])
        if (!match) break
        items.push({ name: match[1], path: match[2] })
      }
      if (items.length === 0) return null
      return { body: lines.slice(0, start).join('\n').trim(), items }
    }

    function UserMessage({ item, pending, t }) {
      const attachmentView = userAttachmentView(item.text)
      return h(
        'div',
        { className: `gb-user${pending ? ' is-pending' : ''}`, id: item.id ? `gb-msg-${item.id}` : undefined },
        h(
          'div',
          { className: 'gb-user-bubble' },
          item.quote
            ? h(
                'div',
                { className: 'gb-quote gb-quote-static' },
                h(
                  'span',
                  { className: 'gb-quote-author' },
                  item.quote.name ? `@${item.quote.name}` : t('replyYou'),
                ),
                h('p', null, item.quote.text),
              )
            : null,
          attachmentView
            ? attachmentView.body
              ? h('div', { className: 'gb-user-text' }, attachmentView.body)
              : null
            : h('div', { className: 'gb-user-text' }, item.text),
          attachmentView ? h(AttachmentCards, { items: attachmentView.items, t }) : null,
          h(
            'div',
            { className: 'gb-user-meta' },
            pending ? h(Spinner, { size: 10 }) : null,
            h('span', null, pending ? t('sending') : formatClock(item.time)),
          ),
        ),
      )
    }

    function ActivityRow({ item, t, open, onToggle }) {
      const label = toolIntent(item, t)
      const status = item.status || 'running'
      return h(
        'div',
        { className: `gb-act${open ? ' is-open' : ''}` },
        h(
          'button',
          { type: 'button', className: 'gb-act-row', onClick: onToggle, 'aria-expanded': open },
          h(
            'span',
            { className: `gb-act-icon is-${status}` },
            status === 'running'
              ? h(Spinner, { size: 12 })
              : h(Icon, { name: status === 'error' ? 'alert' : status === 'stopped' ? 'stop' : 'check', size: 12 }),
          ),
          h(
            'span',
            { className: 'gb-act-main' },
            h('span', { className: 'gb-act-label' }, label),
          ),
          item.durationMs ? h('span', { className: 'gb-act-duration' }, formatDuration(item.durationMs)) : null,
          h(Icon, { name: open ? 'chevronDown' : 'chevronRight', size: 12 }),
        ),
        open
          ? h(
              'div',
              { className: 'gb-act-detail' },
              h('div', { className: 'gb-act-kicker' }, t('technicalDetails')),
              item.argsRaw
                ? h(
                    'div',
                    { className: 'gb-act-section' },
                    h('div', { className: 'gb-act-kicker' }, 'INPUT'),
                    h('pre', null, item.argsRaw),
                  )
                : null,
              item.result
                ? h(
                    'div',
                    { className: 'gb-act-section' },
                    h('div', { className: 'gb-act-kicker' }, 'OUTPUT'),
                    h('pre', null, truncateText(item.result, 2400)),
                  )
                : null,
              item.error
                ? h(
                    'div',
                    { className: 'gb-act-section is-error' },
                    h('div', { className: 'gb-act-kicker' }, 'ERROR'),
                    h('pre', null, `${item.error.name || ''} ${item.error.code || ''}\n${item.error.reason || ''}`.trim()),
                  )
                : null,
            )
          : null,
      )
    }

    function ActivityRun({ items, t }) {
      const [expanded, setExpanded] = useState(items.length <= 2 || items.some((item) => item.status === 'running'))
      const [openId, setOpenId] = useState(null)
      const running = items.some((item) => item.status === 'running')
      const failed = items.some((item) => item.status === 'error')
      const total = items.reduce((sum, item) => sum + (Number(item.durationMs) || 0), 0)
      const speaker = items[0]?.speaker || null
      return h(
        'div',
        { className: `gb-run${running ? ' is-running' : ''}${failed ? ' is-failed' : ''}${speaker ? ' is-member' : ''}` },
        h(
          'button',
          {
            type: 'button',
            className: 'gb-run-head',
            onClick: () => setExpanded((value) => !value),
            'aria-expanded': expanded,
          },
          speaker
            ? h('span', { className: 'gb-run-speaker' }, h('i', null, speaker.emoji || '◉'), speaker.name)
            : null,
          h(
            'span',
            { className: `gb-run-orb${running ? ' is-running' : ''}` },
            running ? h(Spinner, { size: 12 }) : h(Icon, { name: failed ? 'alert' : 'check', size: 12 }),
          ),
          h(
            'span',
            { className: 'gb-run-title' },
            running ? t('working') : t('ranSteps', { n: items.length }),
            total ? h('span', { className: 'gb-run-duration' }, ` · ${formatDuration(total)}`) : null,
          ),
          h('span', { className: 'gb-run-chevron' }, h(Icon, { name: expanded ? 'chevronDown' : 'chevronRight', size: 13 })),
        ),
        expanded ? h('div', { className: 'gb-run-list' }, items.map((item) => h(ActivityRow, {
          key: item.callId || item.seq,
          item,
          t,
          open: openId === item.callId,
          onToggle: () => setOpenId((value) => (value === item.callId ? null : item.callId)),
        }))) : null,
      )
    }

    function Notice({ item, t, onRetry }) {
      const tone = item.tone || 'muted'
      return h(
        'div',
        { className: `gb-notice is-${tone}` },
        h(Icon, { name: tone === 'error' ? 'alert' : tone === 'warn' ? 'alert' : 'spark', size: 14 }),
        h('span', { className: 'gb-notice-text' }, item.text),
        tone === 'error' && onRetry
          ? h('button', { type: 'button', className: 'gb-ghost-btn', onClick: onRetry }, t('retry'))
          : null,
      )
    }

    function AssignmentCard({ item, t, onRetry }) {
      const [retrying, setRetrying] = useState(false)
      const status = item.status || 'running'
      const canRetry =
        Boolean(item.assignmentId) &&
        item.action !== 'hire' &&
        (status === 'failed' || status === 'aborted') &&
        (Number(item.retryCount) || 0) < 3 &&
        typeof onRetry === 'function'
      const retry = async () => {
        if (retrying) return
        setRetrying(true)
        try {
          await onRetry(item.assignmentId)
        } finally {
          setRetrying(false)
        }
      }
      const label =
        status === 'running'
          ? t('assignmentRunning')
          : status === 'success'
            ? t('assignmentDone')
            : status === 'aborted'
              ? t('assignmentAborted')
              : t('assignmentFailed')
      return h(
        'div',
        { className: `gb-assignment is-${status}` },
        h(
          'div',
          { className: 'gb-assignment-head' },
          h('span', { className: 'gb-assignment-avatar' }, item.toEmoji || '◉'),
          h(
            'div',
            { className: 'gb-assignment-text' },
            h(
              'div',
              { className: 'gb-assignment-title' },
              h('strong', null, `${item.action === 'hire' ? t('hireMember') : t('assignmentTo')} ${item.toName || ''}`),
              h('span', { className: 'gb-assignment-status' }, label),
              item.retryCount
                ? h(
                    'span',
                    { className: 'gb-assignment-retry-count' },
                    t('assignmentRetryCount', { n: item.retryCount }),
                  )
                : null,
            ),
            item.title ? h('div', { className: 'gb-assignment-task' }, truncateText(item.title, 160)) : null,
            item.steps || item.durationMs || item.tokens
              ? h(
                  'div',
                  { className: 'gb-assignment-meta' },
                  t('assignmentStats', {
                    steps: item.steps || 0,
                    duration: formatDuration(item.durationMs || 0),
                    tokens: formatTokens(item.tokens || 0),
                  }),
                )
              : null,
          ),
          status === 'running'
            ? h(Spinner, { size: 13 })
            : h(Icon, { name: status === 'success' ? 'check' : 'alert', size: 14 }),
        ),
        item.summary
          ? h(
              'div',
              { className: 'gb-assignment-summary' },
              h('span', null, t('assignmentSummary')),
              h('p', null, truncateText(item.summary, 600)),
            )
          : null,
        canRetry
          ? h(
              'div',
              { className: 'gb-assignment-actions' },
              h(
                'button',
                { type: 'button', className: 'gb-small-btn', disabled: retrying, onClick: retry },
                retrying ? h(Spinner, { size: 11 }) : h(Icon, { name: 'refresh', size: 11 }),
                t('retry'),
              ),
            )
          : null,
      )
    }

    function MessageItem({ item, t, voice, onSpeak, onRetry, onQuote, onPin, pinned, hideReasoning = false }) {
      if (item.kind === 'user') return h(UserMessage, { item, t })
      if (item.kind === 'assistant') return h(AssistantMessage, { item, t, voice, onSpeak, onQuote, onPin, pinned, hideReasoning })
      if (item.kind === 'notice') return h(Notice, { item, t, onRetry })
      return null
    }

    function ReasoningBox({ reasoning, t, streaming }) {
      const [open, setOpen] = useState(Boolean(streaming))
      const text = String(reasoning || '')
      const lines = text.split('\n')
      return h(
        'article',
        { className: `gb-thought${streaming ? ' is-streaming' : ''}` },
        h(
          'div',
          { className: 'gb-thought-head' },
          streaming ? h(Spinner, { size: 12 }) : h(Icon, { name: 'brain', size: 13 }),
          h('span', { className: 'gb-thought-label' }, streaming ? t('thinking') : t('thinkingDone')),
          h('span', { className: 'gb-thought-count gb-mono' }, `${text.length} chars`),
          h(
            'button',
            {
              type: 'button',
              className: 'gb-thought-toggle',
              onClick: () => setOpen((value) => !value),
              'aria-expanded': open,
            },
            h(Icon, { name: open ? 'chevronDown' : 'chevronRight', size: 12 }),
            open ? t('reasoningHide') : t('reasoning'),
          ),
        ),
        open
          ? h(
              'div',
              { className: 'gb-thought-body' },
              lines.map((line, index) => h('p', { key: index }, line || ' ')),
            )
          : null,
      )
    }

    function Welcome({ t, onSend, onCreateTeam, showTeamCta }) {
      const suggestions = [
        ['suggestion1', 'spark'],
        ['suggestion2', 'folder'],
        ['suggestion3', 'activity'],
        ['suggestion4', 'terminal'],
      ]
      return h(
        'section',
        { className: 'gb-welcome' },
        h(
          'div',
          { className: 'gb-welcome-orb' },
          h(Orb, { size: 86, working: false }),
          h('span', { className: 'gb-welcome-ring' }),
        ),
        h('div', { className: 'gb-kicker' }, t('welcomeKicker')),
        h('h1', { className: 'gb-hero-title' }, t('welcomeTitle')),
        h('p', { className: 'gb-hero-sub' }, t('welcomeSub')),
        h(
          'div',
          { className: 'gb-chips' },
          suggestions.map(([key, icon]) =>
            h(
              'button',
              { key, type: 'button', className: 'gb-chip', onClick: () => onSend(t(key)) },
              h(Icon, { name: icon, size: 15 }),
              h('span', null, t(key)),
            ),
          ),
        ),
        showTeamCta && onCreateTeam
          ? h(
              'button',
              { type: 'button', className: 'gb-welcome-team', onClick: onCreateTeam },
              h(Icon, { name: 'agents', size: 16 }),
              h(
                'span',
                { className: 'gb-welcome-team-text' },
                h('strong', null, t('welcomeTeamCta')),
                h('small', null, t('welcomeTeamHint')),
              ),
            )
          : null,
        h('div', { className: 'gb-welcome-foot' }, t('welcomeFoot')),
      )
    }

    function WorkingStrip({ items, t, waiting }) {
      if (waiting) {
        return h(
          'div',
          { className: 'gb-working-strip is-waiting' },
          h(Icon, { name: 'alert', size: 14 }),
          h('span', null, t('waitingForInput')),
          h('span', { className: 'gb-working-target' }, t('waitingForInputHint')),
        )
      }
      const running = [...items].reverse().find((item) => item.kind === 'activity' && item.status === 'running')
      const recent = items
        .filter((item) => item.kind === 'activity' && item.status === 'success')
        .slice(-2)
        .map((item) => toolIntent(item, t))
        .filter(Boolean)
      return h(
        'div',
        { className: 'gb-working-strip' },
        h(Spinner, { size: 14 }),
        h('span', null, running ? `${t('workingOn')} ${toolIntent(running, t)}` : t('thinking')),
        recent.length ? h('span', { className: 'gb-working-target' }, recent.join(' · ')) : null,
      )
    }

    function BotEditor({ bot, catalog, onClose, onSave, onDelete, t }) {
      const isNew = !bot?.id
      const [name, setName] = useState(bot?.name || '')
      const [emoji, setEmoji] = useState(bot?.emoji || '◉')
      const [tagline, setTagline] = useState(bot?.tagline || '')
      const [persona, setPersona] = useState(bot?.persona || '')
      const [presetId, setPresetId] = useState(bot?.presetId || '')
      const [provider, setProvider] = useState(bot?.provider || '')
      const [model, setModel] = useState(bot?.model || '')
      const [effort, setEffort] = useState(bot?.reasoningEffort || '')
      const [workspace, setWorkspace] = useState(bot?.workspaceOverride || '')
      const [privilege, setPrivilege] = useState(bot?.privilege || 'standard')
      const [adminAck, setAdminAck] = useState(false)
      const [autonomy, setAutonomy] = useState(bot?.autonomy || 'interactive')
      const [role, setRole] = useState(bot?.role || 'member')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')

      useEffect(() => {
        setName(bot?.name || '')
        setEmoji(bot?.emoji || '◉')
        setTagline(bot?.tagline || '')
        setPersona(bot?.persona || '')
        setPresetId(bot?.presetId || '')
        setProvider(bot?.provider || '')
        setModel(bot?.model || '')
        setEffort(bot?.reasoningEffort || '')
        setWorkspace(bot?.workspaceOverride || '')
        setPrivilege(bot?.privilege || 'standard')
        setAdminAck(false)
        setAutonomy(bot?.autonomy || 'interactive')
        setRole(bot?.role || 'member')
        setError('')
      }, [bot?.id])

      const presets = catalog?.presets || []
      const providers = catalog?.providers || []
      const activeProvider = providers.find((item) => item.id === provider)
      const models = activeProvider?.models || []

      const chooseProvider = (value) => {
        setProvider(value)
        const next = providers.find((item) => item.id === value)
        setModel(next?.models?.[0]?.id || '')
      }

      const submit = async () => {
        if (busy) return
        if (!String(name || '').trim()) {
          setError(t('botNameRequired'))
          return
        }
        if (privilege === 'admin' && !adminAck && bot?.privilege !== 'admin') {
          setError(t('adminConfirmRequired'))
          return
        }
        setBusy(true)
        setError('')
        try {
          await onSave({
            id: bot?.id || null,
            name: String(name).trim(),
            emoji: String(emoji || '◉').trim().slice(0, 8) || '◉',
            tagline: String(tagline || '').trim(),
            persona: String(persona || '').trim(),
            presetId: presetId || null,
            provider: provider || null,
            model: model || null,
            reasoningEffort: effort || null,
            workspace: String(workspace || '').trim() || null,
            privilege,
            autonomy,
            role,
          })
        } catch (caught) {
          setError(caught?.message || String(caught))
        } finally {
          setBusy(false)
        }
      }

      return h(
        'div',
        {
          className: 'gb-modal-backdrop',
          role: 'presentation',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose?.()
          },
        },
        h(
          'div',
          { className: 'gb-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('editBot') },
          h(
            'div',
            { className: 'gb-modal-head' },
            h('div', null, h('div', { className: 'gb-kicker-small' }, t('bots')), h('h2', null, isNew ? t('newBot') : t('editBot'))),
            h(
              'button',
              { type: 'button', className: 'gb-icon-btn', onClick: onClose, 'aria-label': t('close') },
              h(Icon, { name: 'close', size: 16 }),
            ),
          ),
          h(
            'div',
            { className: 'gb-modal-body' },
            h(
              'div',
              { className: 'gb-field-row' },
              h(
                'label',
                { className: 'gb-field gb-field-emoji' },
                h('span', null, t('botEmoji')),
                h('input', {
                  value: emoji,
                  maxLength: 8,
                  onChange: (event) => setEmoji(event.target.value),
                  placeholder: '◉',
                }),
              ),
              h(
                'label',
                { className: 'gb-field' },
                h('span', null, t('botName')),
                h('input', {
                  value: name,
                  maxLength: 32,
                  onChange: (event) => setName(event.target.value),
                  placeholder: t('botNamePlaceholder'),
                }),
              ),
            ),
            h(
              'label',
              { className: 'gb-field' },
              h('span', null, t('botTagline')),
              h('input', {
                value: tagline,
                maxLength: 80,
                onChange: (event) => setTagline(event.target.value),
                placeholder: t('botTaglinePlaceholder'),
              }),
            ),
            h(
              'label',
              { className: 'gb-field' },
              h('span', null, t('botPersona')),
              h('textarea', {
                value: persona,
                rows: 4,
                maxLength: 8000,
                onChange: (event) => setPersona(event.target.value),
                placeholder: t('botPersonaPlaceholder'),
              }),
              h('small', null, t('botPersonaHint')),
            ),
            h(
              'div',
              { className: 'gb-field-row' },
              h(
                'label',
                { className: 'gb-field' },
                h('span', null, t('botPreset')),
                h(
                  'select',
                  { value: presetId, onChange: (event) => setPresetId(event.target.value) },
                  h('option', { value: '' }, t('botPresetAuto')),
                  presets.map((preset) =>
                    h('option', { key: preset.id, value: preset.id }, preset.name || preset.id),
                  ),
                ),
              ),
              h(
                'label',
                { className: 'gb-field' },
                h('span', null, t('botModel')),
                h(
                  'select',
                  { value: provider, onChange: (event) => chooseProvider(event.target.value) },
                  h('option', { value: '' }, t('botModelAuto')),
                  providers.map((item) => h('option', { key: item.id, value: item.id }, item.name || item.id)),
                ),
                provider
                  ? h(
                      'select',
                      { value: model, onChange: (event) => setModel(event.target.value) },
                      models.length === 0 ? h('option', { value: model }, model || t('botModelAuto')) : null,
                      models.map((item) => h('option', { key: item.id, value: item.id }, item.name || item.id)),
                    )
                  : null,
              ),
            ),
            h(
              'label',
              { className: 'gb-field' },
              h('span', null, t('botEffort')),
              h(
                'select',
                { value: effort, onChange: (event) => setEffort(event.target.value) },
                h('option', { value: '' }, t('botEffortAuto')),
                h('option', { value: 'high' }, 'high'),
                h('option', { value: 'max' }, 'max'),
              ),
              h('small', null, t('botEffortHint')),
            ),
            h(
              'label',
              { className: 'gb-field' },
              h('span', null, t('botWorkspace')),
              h('input', {
                value: workspace,
                maxLength: 320,
                onChange: (event) => setWorkspace(event.target.value),
                placeholder: t('botWorkspacePlaceholder'),
              }),
              h('small', null, t('botWorkspaceHint')),
            ),
            h(
              'label',
              { className: 'gb-field' },
              h('span', null, t('role')),
              h(
                'select',
                { value: role, onChange: (event) => setRole(event.target.value) },
                h('option', { value: 'member' }, t('roleMember')),
                h('option', { value: 'lead' }, t('roleLead')),
              ),
              h('small', null, t('roleHint')),
            ),
            h(
              'label',
              { className: 'gb-field' },
              h('span', null, t('botPrivilege')),
              h(
                'select',
                { value: privilege, onChange: (event) => setPrivilege(event.target.value) },
                h('option', { value: 'standard' }, t('botPrivilegeStandard')),
                h('option', { value: 'admin' }, t('botPrivilegeAdmin')),
              ),
              h('small', null, t('botPrivilegeHint')),
              privilege === 'admin'
                ? h(
                    'label',
                    { className: 'gb-admin-ack' },
                    h('input', {
                      type: 'checkbox',
                      checked: adminAck,
                      onChange: (event) => setAdminAck(event.target.checked),
                    }),
                    h('span', null, t('adminAckLabel')),
                  )
                : null,
            ),
            h(
              'label',
              { className: 'gb-field' },
              h('span', null, t('botAutonomy')),
              h(
                'select',
                { value: autonomy, onChange: (event) => setAutonomy(event.target.value) },
                h('option', { value: 'interactive' }, t('botAutonomyInteractive')),
                h('option', { value: 'unattended' }, t('botAutonomyUnattended')),
              ),
              h('small', null, t('botAutonomyHint')),
            ),
            error ? h('div', { className: 'gb-modal-error' }, h(Icon, { name: 'alert', size: 13 }), h('span', null, error)) : null,
          ),
          h(
            'div',
            { className: 'gb-modal-foot' },
            !isNew && bot?.id !== 'bot-default'
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'gb-danger-btn',
                    disabled: busy,
                    onClick: async () => {
                      if (!window.confirm(t('botDeleteConfirm'))) return
                      setBusy(true)
                      try {
                        await onDelete(bot)
                      } catch (caught) {
                        setError(caught?.message || String(caught))
                        setBusy(false)
                      }
                    },
                  },
                  h(Icon, { name: 'trash', size: 13 }),
                  t('botDelete'),
                )
              : h('span'),
            h(
              'div',
              { className: 'gb-modal-foot-right' },
              h('button', { type: 'button', className: 'gb-ghost-btn', onClick: onClose, disabled: busy }, t('cancel')),
              h(
                'button',
                { type: 'button', className: 'gb-primary-btn', onClick: submit, disabled: busy },
                busy ? h(Spinner, { size: 12 }) : h(Icon, { name: 'check', size: 13 }),
                busy ? t('botSaving') : t('botSave'),
              ),
            ),
          ),
        ),
      )
    }

    function GroupEditor({ group, bots, onClose, onSave, onDelete, t }) {
      const isNew = !group?.id
      const memberBots = Array.isArray(bots) ? bots : []
      const [name, setName] = useState(group?.name || '')
      const [emoji, setEmoji] = useState(group?.emoji || '◈')
      const [memberIds, setMemberIds] = useState(Array.isArray(group?.memberIds) ? [...group.memberIds] : [])
      const [routing, setRouting] = useState(group?.routing === 'leader' ? 'leader' : 'all')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')

      useEffect(() => {
        setName(group?.name || '')
        setEmoji(group?.emoji || '◈')
        setMemberIds(Array.isArray(group?.memberIds) ? [...group.memberIds] : [])
        setRouting(group?.routing === 'leader' ? 'leader' : 'all')
        setError('')
      }, [group?.id])

      const toggle = (id) => {
        setMemberIds((previous) =>
          previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id].slice(0, 8),
        )
      }

      const submit = async () => {
        if (busy) return
        if (!String(name || '').trim()) {
          setError(t('groupName'))
          return
        }
        if (memberIds.length < 2) {
          setError(t('groupMinMembers'))
          return
        }
        setBusy(true)
        setError('')
        try {
          await onSave({
            threadId: group?.id || null,
            name: String(name).trim(),
            emoji: String(emoji || '◈').trim().slice(0, 8) || '◈',
            memberIds,
            routing,
          })
        } catch (caught) {
          setError(caught?.message || String(caught))
          setBusy(false)
        }
      }

      return h(
        'div',
        {
          className: 'gb-modal-backdrop',
          role: 'presentation',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose?.()
          },
        },
        h(
          'div',
          { className: 'gb-modal gb-modal-group', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('editGroup') },
          h(
            'div',
            { className: 'gb-modal-head' },
            h(
              'div',
              null,
              h('div', { className: 'gb-kicker-small' }, t('groups')),
              h('h2', null, isNew ? t('newGroup') : t('editGroup')),
            ),
            h(
              'button',
              { type: 'button', className: 'gb-icon-btn', onClick: onClose, 'aria-label': t('close') },
              h(Icon, { name: 'close', size: 16 }),
            ),
          ),
          h(
            'div',
            { className: 'gb-modal-body' },
            h(
              'div',
              { className: 'gb-field-row' },
              h(
                'label',
                { className: 'gb-field gb-field-emoji' },
                h('span', null, t('group')),
                h('input', {
                  value: emoji,
                  maxLength: 8,
                  onChange: (event) => setEmoji(event.target.value),
                  placeholder: '◈',
                }),
              ),
              h(
                'label',
                { className: 'gb-field' },
                h('span', null, t('groupName')),
                h('input', {
                  value: name,
                  maxLength: 32,
                  onChange: (event) => setName(event.target.value),
                  placeholder: t('groupNamePlaceholder'),
                }),
              ),
            ),
            h(
              'div',
              { className: 'gb-field' },
              h('span', null, t('groupMembers')),
              h(
                'div',
                { className: 'gb-member-picks' },
                memberBots.map((bot) =>
                  h(
                    'button',
                    {
                      key: bot.id,
                      type: 'button',
                      className: `gb-member-pick${memberIds.includes(bot.id) ? ' is-on' : ''}`,
                      onClick: () => toggle(bot.id),
                      'aria-pressed': memberIds.includes(bot.id),
                    },
                    h('span', { className: 'gb-member-pick-avatar' }, bot.emoji || '◉'),
                    h(
                      'span',
                      { className: 'gb-member-pick-text' },
                      h('strong', null, bot.name),
                      h('small', null, bot.tagline || bot.modelLabel || ''),
                    ),
                    memberIds.includes(bot.id) ? h(Icon, { name: 'check', size: 13 }) : null,
                  ),
                ),
              ),
              h('small', null, t('groupHint')),
            ),
            h(
              'label',
              { className: 'gb-field' },
              h('span', null, t('groupRouting')),
              h(
                'select',
                {
                  value: routing,
                  onChange: (event) => setRouting(event.target.value),
                },
                h('option', { value: 'all' }, t('groupRoutingAll')),
                h('option', { value: 'leader' }, t('groupRoutingLeader')),
              ),
              h('small', null, t('groupRoutingHint')),
            ),
            error ? h('div', { className: 'gb-modal-error' }, h(Icon, { name: 'alert', size: 13 }), h('span', null, error)) : null,
          ),
          h(
            'div',
            { className: 'gb-modal-foot' },
            !isNew
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'gb-danger-btn',
                    disabled: busy,
                    onClick: async () => {
                      if (!window.confirm(t('groupDeleteConfirm'))) return
                      setBusy(true)
                      try {
                        await onDelete(group)
                      } catch (caught) {
                        setError(caught?.message || String(caught))
                        setBusy(false)
                      }
                    },
                  },
                  h(Icon, { name: 'trash', size: 13 }),
                  t('groupDelete'),
                )
              : h('span'),
            h(
              'div',
              { className: 'gb-modal-foot-right' },
              h('button', { type: 'button', className: 'gb-ghost-btn', onClick: onClose, disabled: busy }, t('cancel')),
              h(
                'button',
                { type: 'button', className: 'gb-primary-btn', onClick: submit, disabled: busy },
                busy ? h(Spinner, { size: 12 }) : h(Icon, { name: 'check', size: 13 }),
                busy ? t('groupSaving') : isNew ? t('groupCreate') : t('groupSave'),
              ),
            ),
          ),
        ),
      )
    }

    function Sidebar({
      bot,
      bots,
      activeBotId,
      onSelectBot,
      onNewBot,
      onEditBot,
      onNewGroup,
      onTeam,
      onPin,
      onReorder,
      roster,
      threads,
      activeId,
      onSelect,
      onNew,
      onDelete,
      onMemory,
      onGuide,
      onClose,
      t,
      open,
    }) {
      const botList = Array.isArray(bots) ? bots : []
      const runningBots = new Set(
        (Array.isArray(roster) ? roster : []).filter((member) => member.running).map((member) => member.id),
      )
      const [showArchived, setShowArchived] = useState(false)
      const [dragId, setDragId] = useState(null)
      const archivedCount = threads.filter((thread) => thread.archived).length
      const visibleThreads = threads.filter((thread) => showArchived || !thread.archived)
      return h(
        'aside',
        { className: `gb-rail${open ? ' is-open' : ''}`, 'aria-label': t('panel') },
        h(
          'div',
          { className: 'gb-brand' },
          h(Orb, { size: 34, working: false }),
          h(
            'div',
            { className: 'gb-brand-text' },
            h('div', { className: 'gb-brand-name' }, 'DSH BOT'),
            h('div', { className: 'gb-brand-tag' }, t('brandTag')),
          ),
          h(
            'button',
            { type: 'button', className: 'gb-icon-btn gb-rail-close', onClick: onClose, 'aria-label': t('close') },
            h(Icon, { name: 'close', size: 16 }),
          ),
        ),
        h(
          'div',
          { className: 'gb-bot-strip', role: 'tablist', 'aria-label': t('bots') },
          botList.map((item) =>
            h(
              'button',
              {
                key: item.id,
                type: 'button',
                role: 'tab',
                'aria-selected': item.id === activeBotId,
                className: `gb-bot-chip${item.id === activeBotId ? ' is-active' : ''}`,
                onClick: () => onSelectBot?.(item.id),
                title: `${item.name}${item.tagline ? ` · ${item.tagline}` : ''}`,
              },
              h('span', { className: 'gb-bot-avatar' }, item.emoji || '◉'),
              h('span', { className: 'gb-bot-label' }, item.name),
              h('span', { className: `gb-bot-run${runningBots.has(item.id) ? ' is-running' : ''}` }),
            ),
          ),
          h(
            'button',
            { type: 'button', className: 'gb-bot-add', onClick: onNewBot, title: t('newBot'), 'aria-label': t('newBot') },
            h(Icon, { name: 'plus', size: 13 }),
          ),
          h(
            'button',
            { type: 'button', className: 'gb-bot-edit', onClick: () => onEditBot?.(bot), title: t('editBot'), 'aria-label': t('editBot') },
            h(Icon, { name: 'pencil', size: 12 }),
          ),
        ),
        h(
          'div',
          { className: 'gb-presence' },
          h(StatusDot, { running: true }),
          h('span', null, t('online')),
          h('span', { className: 'gb-presence-sep' }, '·'),
          h('span', { className: 'gb-presence-model' }, bot?.tagline || bot?.modelLabel || t('modelAuto')),
        ),
        h(
          'button',
          { type: 'button', className: 'gb-new-btn', onClick: onNew },
          h(Icon, { name: 'plus', size: 16 }),
          h('span', null, t('newTask')),
          h('span', { className: 'gb-new-kbd' }, 'Ctrl N'),
        ),
        h(
          'div',
          { className: 'gb-section-label' },
          h('span', null, t('tasks')),
          h('span', { className: 'gb-section-count' }, visibleThreads.length),
          h(
            'button',
            { type: 'button', className: 'gb-section-action', onClick: onNewGroup, title: t('newGroup') },
            h(Icon, { name: 'plus', size: 11 }),
            h('span', null, t('group')),
          ),
        ),
        h(
          'div',
          { className: 'gb-thread-list', role: 'list' },
          visibleThreads.length === 0
            ? h('div', { className: 'gb-thread-empty' }, t('noTasks'))
            : visibleThreads.map((thread) =>
                h(
                  'div',
                  {
                    key: thread.id,
                    className: `gb-thread${thread.id === activeId ? ' is-active' : ''}${thread.running ? ' is-running' : ''}${dragId === thread.id ? ' is-dragging' : ''}`,
                    role: 'listitem',
                    draggable: thread.pinned === true,
                    onDragStart: (event) => {
                      if (!thread.pinned) return
                      setDragId(thread.id)
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/plain', thread.id)
                    },
                    onDragOver: (event) => {
                      if (dragId && thread.pinned) event.preventDefault()
                    },
                    onDrop: (event) => {
                      event.preventDefault()
                      if (!dragId || !thread.pinned || dragId === thread.id) {
                        setDragId(null)
                        return
                      }
                      const ids = visibleThreads.filter((item) => item.pinned).map((item) => item.id)
                      const from = ids.indexOf(dragId)
                      const to = ids.indexOf(thread.id)
                      if (from < 0 || to < 0) {
                        setDragId(null)
                        return
                      }
                      ids.splice(to, 0, ids.splice(from, 1)[0])
                      onReorder?.(ids)
                      setDragId(null)
                    },
                    onDragEnd: () => setDragId(null),
                  },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'gb-thread-main',
                      onClick: () => onSelect(thread.id),
                      title: thread.title,
                    },
                    h(
                      'span',
                      { className: 'gb-thread-icon' },
                      thread.running
                        ? h(Spinner, { size: 13 })
                        : thread.kind === 'group'
                          ? h(
                              'span',
                              { className: 'gb-thread-stack' },
                              (thread.members || []).slice(0, 2).map((member) =>
                                h('i', { key: member.id }, member.emoji || '◉'),
                              ),
                            )
                          : h(Icon, { name: thread.kind === 'routine' ? 'clock' : 'spark', size: 14 }),
                    ),
                    h(
                      'span',
                      { className: 'gb-thread-text' },
                      h(
                        'span',
                        { className: 'gb-thread-title' },
                        thread.kind === 'group' ? `${thread.emoji || '◈'} ` : thread.kind === 'routine' ? `${t('taskRoutine')} · ` : '',
                        thread.title || (thread.kind === 'group' ? t('newGroup') : t('untitled')),
                      ),
                      h(
                        'span',
                        { className: 'gb-thread-meta' },
                        thread.running
                          ? t('taskRunning')
                          : thread.kind === 'group'
                            ? `${t('groupMembersCount', { n: (thread.members || []).length })} · ${formatRelative(thread.updatedAt, t)}`
                            : formatRelative(thread.updatedAt, t),
                        h(
                          'span',
                          { className: `gb-thread-difficulty is-${thread.difficulty || 'standard'}` },
                          t(thread.difficulty === 'simple' ? 'difficultySimple' : thread.difficulty === 'hard' ? 'difficultyHard' : 'difficultyStandard'),
                        ),
                      ),
                    ),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: `gb-thread-pin${thread.pinned ? ' is-pinned' : ''}`,
                      onClick: (event) => {
                        event.stopPropagation()
                        onPin?.(thread)
                      },
                      title: thread.pinned ? t('unpin') : t('pin'),
                      'aria-label': thread.pinned ? t('unpin') : t('pin'),
                    },
                    thread.pinned ? '★' : '☆',
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'gb-thread-delete',
                      onClick: (event) => {
                        event.stopPropagation()
                        onDelete(thread)
                      },
                      title: t('delete'),
                      'aria-label': t('delete'),
                    },
                    h(Icon, { name: 'trash', size: 13 }),
                  ),
                ),
              ),
        ),
        archivedCount > 0
          ? h(
              'button',
              {
                type: 'button',
                className: 'gb-thread-archived-toggle',
                onClick: () => setShowArchived((value) => !value),
              },
              showArchived ? t('hideArchived') : t('showArchived', { n: archivedCount }),
            )
          : null,
        h('div', { className: 'gb-rail-grow' }),
        h(
          'div',
          { className: 'gb-rail-foot' },
          h(
            'button',
            { type: 'button', className: 'gb-rail-foot-btn', onClick: onTeam },
            h(Icon, { name: 'agents', size: 15 }),
            h('span', null, t('teamTemplate')),
          ),
          h(
            'button',
            { type: 'button', className: 'gb-rail-foot-btn', onClick: onMemory },
            h(Icon, { name: 'brain', size: 15 }),
            h('span', null, t('memory')),
          ),
          h(
            'button',
            { type: 'button', className: 'gb-rail-foot-btn', onClick: onGuide },
            h(Icon, { name: 'help', size: 15 }),
            h('span', null, t('guideOpen')),
          ),
          h(
            'div',
            { className: 'gb-local-badge' },
            h('span', { className: 'gb-signal' }),
            h('span', null, t('localAccess')),
          ),
          h('div', { className: 'gb-host-line' }, `${bot?.host || 'localhost'} · ${bot?.platform || 'Windows'}`),
        ),
      )
    }

    function GuideModal({ step, onStep, onClose, onCreate, onAdd, t }) {
      const steps = [
        {
          title: t('guideStep1Title'),
          body: t('guideStep1Body'),
          bullets: [t('guideStep1Bullet1'), t('guideStep1Bullet2')],
          action: { label: t('guideStartTask'), onClick: onCreate },
        },
        {
          title: t('guideStep2Title'),
          body: t('guideStep2Body'),
          bullets: [t('guideStep2Bullet1'), t('guideStep2Bullet2')],
          action: { label: t('guideAddSpecialist'), onClick: onAdd },
        },
        {
          title: t('guideStep3Title'),
          body: t('guideStep3Body'),
          bullets: [t('guideStep3Bullet1'), t('guideStep3Bullet2'), t('guideStep3Bullet3')],
        },
        {
          title: t('guideStep4Title'),
          body: t('guideStep4Body'),
          bullets: [t('guideStep4Bullet1'), t('guideStep4Bullet2'), t('guideStep4Bullet3')],
        },
      ]
      const current = steps[Math.min(step, steps.length - 1)]
      return h(
        'div',
        { className: 'gb-guide-backdrop', role: 'dialog', 'aria-modal': 'true', onClick: onClose },
        h(
          'div',
          { className: 'gb-guide', onClick: (event) => event.stopPropagation() },
          h(
            'div',
            { className: 'gb-guide-head' },
            h('div', { className: 'gb-guide-mark' }, h(Icon, { name: 'sparkles', size: 18 })),
            h(
              'div',
              { className: 'gb-guide-headings' },
              h('span', { className: 'gb-guide-kicker' }, t('guideKicker')),
              h('h2', null, t('guideTitle')),
            ),
            h(
              'button',
              { type: 'button', className: 'gb-icon-btn', onClick: onClose, 'aria-label': t('close') },
              h(Icon, { name: 'close', size: 14 }),
            ),
          ),
          h(
            'div',
            { className: 'gb-guide-progress' },
            steps.map((item, index) =>
              h(
                'button',
                {
                  key: item.title,
                  type: 'button',
                  className: `gb-guide-dot${index === step ? ' is-active' : ''}${index < step ? ' is-done' : ''}`,
                  onClick: () => onStep(index),
                  'aria-label': item.title,
                },
                index < step ? h(Icon, { name: 'check', size: 10 }) : String(index + 1),
              ),
            ),
          ),
          h(
            'div',
            { className: 'gb-guide-body' },
            h('span', { className: 'gb-guide-step' }, `${String(step + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`),
            h('h3', null, current.title),
            h('p', null, current.body),
            h(
              'ul',
              { className: 'gb-guide-list' },
              current.bullets.map((item) => h('li', { key: item }, h(Icon, { name: 'check', size: 12 }), h('span', null, item))),
            ),
            current.action
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'gb-guide-action',
                    onClick: current.action.onClick,
                  },
                  current.action.label,
                  h(Icon, { name: 'chevronRight', size: 13 }),
                )
              : null,
          ),
          h(
            'div',
            { className: 'gb-guide-foot' },
            h('button', { type: 'button', className: 'gb-small-btn', onClick: onClose }, t('guideSkip')),
            h('div', { className: 'gb-guide-foot-right' },
              step > 0
                ? h('button', { type: 'button', className: 'gb-small-btn', onClick: () => onStep(step - 1) }, t('guidePrev'))
                : null,
              h(
                'button',
                {
                  type: 'button',
                  className: 'gb-small-btn is-primary',
                  onClick: step >= steps.length - 1 ? onClose : () => onStep(step + 1),
                },
                step >= steps.length - 1 ? t('guideDone') : t('guideNext'),
              ),
            ),
          ),
        ),
      )
    }

    function cleanProblemReason(value) {
      const source = String(value || '').replace(/\s*附件[：:][\s\S]*$/, '')
      const lines = source.split('\n')
      const kept = []
      let skipAttachments = false
      for (const line of lines) {
        if (/^\s*附件[：:]\s*$/.test(line)) {
          skipAttachments = true
          continue
        }
        if (skipAttachments && /^\s*[-*]\s*\[[^\]]+\]\(<[^>]+>\)\s*$/.test(line)) continue
        if (skipAttachments && !line.trim()) continue
        skipAttachments = false
        kept.push(line)
      }
      return kept.join('\n').trim()
    }

    function Toast({ message, onClose, t }) {
      useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose])
      return h(
        'div',
        { className: 'gb-toast', role: 'status', 'aria-live': 'polite' },
        h(Icon, { name: 'spark', size: 14 }),
        h('span', { className: 'gb-toast-text' }, message),
        h(
          'button',
          {
            type: 'button',
            className: 'gb-toast-close',
            onClick: onClose,
            'aria-label': t('close'),
            title: t('close'),
          },
          h(Icon, { name: 'close', size: 12 }),
        ),
      )
    }

    function ProblemCard({ reason, items, t, onRetry, onRephrase, onCopy }) {
      const tried = [...(items || [])]
        .reverse()
        .filter((item) => item.kind === 'activity')
        .slice(0, 3)
        .map((item) => toolIntent(item, t))
        .filter(Boolean)
      const visibleReason = cleanProblemReason(reason) || t('problemUnknown')
      return h(
        'div',
        { className: 'gb-problem' },
        h('div', { className: 'gb-problem-icon' }, h(Icon, { name: 'alert', size: 16 })),
        h(
          'div',
          { className: 'gb-problem-body' },
          h('div', { className: 'gb-problem-title' }, t('problemTitle')),
          h('p', { className: 'gb-problem-reason' }, visibleReason),
          tried.length ? h('div', { className: 'gb-problem-tried' }, `${t('problemTried')}：${tried.join(' · ')}`) : null,
          h(
            'div',
            { className: 'gb-problem-actions' },
            h('button', { type: 'button', className: 'gb-small-btn', onClick: onRetry }, t('problemRetry')),
            h('button', { type: 'button', className: 'gb-small-btn', onClick: onRephrase }, t('problemRephrase')),
            h('button', { type: 'button', className: 'gb-small-btn', onClick: onCopy }, t('problemCopy')),
          ),
          reason
            ? h(
                'details',
                { className: 'gb-problem-details' },
                h('summary', null, t('problemDetails')),
                h('pre', null, String(visibleReason)),
              )
            : null,
        ),
      )
    }

    function ReplayModal({ items, t, onClose }) {
      const timeline = (Array.isArray(items) ? items : [])
        .filter((item) => (item.kind === 'user' || item.kind === 'assistant') && String(item.text || '').trim())
        .slice(-120)
      const [index, setIndex] = useState(0)
      const [playing, setPlaying] = useState(true)
      useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') onClose?.()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose])
      useEffect(() => {
        if (!playing || timeline.length < 2) return undefined
        const timer = setInterval(() => {
          setIndex((value) => {
            if (value >= timeline.length - 1) {
              setPlaying(false)
              return value
            }
            return value + 1
          })
        }, 1800)
        return () => clearInterval(timer)
      }, [playing, timeline.length])
      const current = timeline[index]
      return h(
        'div',
        { className: 'gb-modal-backdrop', onClick: onClose },
        h(
          'div',
          {
            className: 'gb-modal gb-replay',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': t('replayTitle'),
            onClick: (event) => event.stopPropagation(),
          },
          h(
            'div',
            { className: 'gb-modal-head' },
            h('div', null, h('div', { className: 'gb-modal-title' }, t('replayTitle')), h('div', { className: 'gb-modal-sub' }, `${index + 1} / ${timeline.length}`)),
            h('button', { type: 'button', className: 'gb-icon-btn', onClick: onClose, 'aria-label': t('close') }, h(Icon, { name: 'close', size: 15 })),
          ),
          h(
            'div',
            { className: 'gb-replay-body' },
            !current
              ? h('div', { className: 'gb-replay-empty' }, t('replayEmpty'))
              : h(
                  'div',
                  { className: 'gb-replay-item' },
                  h('div', { className: `gb-replay-author${current.kind === 'user' ? ' is-user' : ''}` }, current.kind === 'user' ? t('replyYou') : current.speaker?.name || t('replayBot')),
                  h('div', { className: 'gb-replay-text' }, current.text),
                ),
          ),
          h(
            'div',
            { className: 'gb-replay-controls' },
            h(
              'button',
              {
                type: 'button',
                className: 'gb-small-btn',
                onClick: () => {
                  if (index >= timeline.length - 1) setIndex(0)
                  setPlaying((value) => !value)
                },
              },
              playing ? t('replayPause') : t('replayPlay'),
            ),
            h('input', {
              type: 'range',
              min: 0,
              max: Math.max(0, timeline.length - 1),
              value: Math.min(index, Math.max(0, timeline.length - 1)),
              onChange: (event) => setIndex(Number(event.target.value)),
              'aria-label': t('replayStep'),
            }),
            h('button', { type: 'button', className: 'gb-small-btn', onClick: onClose }, t('close')),
          ),
        ),
      )
    }

    function TopBar({ thread, model, running, channel, onManage, onRename, onSearch, onExport, onPins, onReplay, archived, onArchive, theme, onTheme, t }) {
      const difficulty = ['simple', 'standard', 'hard'].includes(thread?.difficulty) ? thread.difficulty : 'standard'
      const difficultyKey = `difficulty${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`
      const members = channel?.members || []
      const [editing, setEditing] = useState(false)
      const [draft, setDraft] = useState('')
      const [themeOpen, setThemeOpen] = useState(false)
      const themeOptions = [
        { id: 'dark', label: 'themeDark', hint: 'themeDarkHint' },
        { id: 'warm', label: 'themeWarm', hint: 'themeWarmHint' },
        { id: 'ink', label: 'themeInk', hint: 'themeInkHint' },
        { id: 'aurora', label: 'themeAurora', hint: 'themeMistHint' },
        { id: 'ember', label: 'themeEmber', hint: 'themeClayHint' },
      ]
      const currentTheme = themeOptions.find((item) => item.id === theme) || themeOptions[0]
      useEffect(() => {
        if (!themeOpen) return undefined
        const close = (event) => {
          if (event.type === 'keydown' && event.key !== 'Escape') return
          if (event.type === 'pointerdown' && event.target?.closest?.('.gb-theme-picker')) return
          setThemeOpen(false)
        }
        window.addEventListener('keydown', close)
        window.addEventListener('pointerdown', close)
        return () => {
          window.removeEventListener('keydown', close)
          window.removeEventListener('pointerdown', close)
        }
      }, [themeOpen])
      const title = channel ? `${channel.emoji || '◈'} ${channel.name}` : thread?.title || t('untitled')
      const beginRename = () => {
        setDraft(thread?.title || channel?.name || '')
        setEditing(true)
      }
      const commitRename = () => {
        const value = draft.trim()
        setEditing(false)
        if (value && value !== (thread?.title || '')) onRename?.(value)
      }
      return h(
        'header',
        { className: 'gb-topbar' },
        h(
          'div',
          { className: 'gb-topbar-left' },
          h(
            'div',
            { className: 'gb-topbar-title' },
            editing
              ? h('input', {
                  className: 'gb-topbar-input',
                  autoFocus: true,
                  value: draft,
                  maxLength: 80,
                  onChange: (event) => setDraft(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') commitRename()
                    if (event.key === 'Escape') setEditing(false)
                  },
                  onBlur: commitRename,
                })
              : h(
                  'div',
                  { className: 'gb-topbar-name', onDoubleClick: beginRename, title: t('renameHint') },
                  title,
                ),
            h(
              'div',
              { className: 'gb-topbar-status' },
              h(StatusDot, { running }),
              h('span', null, running ? t('taskRunning') : t('taskIdle')),
              h('span', { className: 'gb-sep' }, '·'),
              channel
                ? h('span', null, t('groupMembersCount', { n: members.length }))
                : h('span', { className: 'gb-mono' }, model || t('modelAuto')),
              h('span', { className: `gb-difficulty-pill is-${difficulty}`, title: t('difficulty') }, t(difficultyKey)),
            ),
          ),
          channel
            ? h(
                'div',
                { className: 'gb-topbar-members' },
                members.map((member) =>
                  h(
                    'span',
                    { key: member.id, className: `gb-topbar-member${member.running ? ' is-running' : ''}` },
                    h('i', null, member.emoji || '◉'),
                    member.name,
                  ),
                ),
                onManage
                  ? h(
                      'button',
                      { type: 'button', className: 'gb-topbar-manage', onClick: onManage, title: t('editGroup') },
                      h(Icon, { name: 'pencil', size: 11 }),
                      h('span', null, t('editGroup')),
                    )
                  : null,
              )
            : null,
        ),
        h(
          'div',
          { className: 'gb-topbar-meta' },
          onPins
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'gb-topbar-archive',
                  onClick: onPins,
                  title: t('pinsTitle'),
                },
                h(Icon, { name: 'pin', size: 11 }),
              )
            : null,
          onExport
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'gb-topbar-archive',
                  onClick: onExport,
                  title: t('exportThread'),
                },
                h(Icon, { name: 'arrowDown', size: 11 }),
              )
            : null,
          onReplay
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'gb-topbar-archive',
                  onClick: onReplay,
                  title: t('replay'),
                },
                h(Icon, { name: 'play', size: 11 }),
              )
            : null,
          onSearch
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'gb-topbar-archive',
                  onClick: onSearch,
                  title: t('searchTitle'),
                },
                h(Icon, { name: 'search', size: 11 }),
              )
            : null,
          onArchive
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'gb-topbar-archive',
                  onClick: () => onArchive(!archived),
                },
                h(Icon, { name: 'folder', size: 11 }),
                archived ? t('unarchive') : t('archive'),
              )
            : null,
          h(
            'div',
            { className: 'gb-theme-picker' },
            h(
              'button',
              {
                type: 'button',
                className: 'gb-theme-trigger',
                onClick: () => setThemeOpen((open) => !open),
                'aria-expanded': themeOpen,
                'aria-label': t('theme'),
                title: t('theme'),
              },
              h('span', { className: `gb-theme-swatch is-${theme}` }),
              h('span', null, t(currentTheme.label)),
              h(Icon, { name: 'chevronDown', size: 10 }),
            ),
            themeOpen
              ? h(
                  'div',
                  { className: 'gb-theme-pop', role: 'listbox', 'aria-label': t('theme') },
                  h('div', { className: 'gb-theme-pop-head' }, t('theme')),
                  themeOptions.map((option) =>
                    h(
                      'button',
                      {
                        key: option.id,
                        type: 'button',
                        role: 'option',
                        'aria-selected': theme === option.id,
                        'aria-label': t(option.label),
                        title: t(option.hint),
                        className: `gb-theme-option${theme === option.id ? ' is-active' : ''}`,
                        onClick: () => {
                          onTheme?.(option.id)
                          setThemeOpen(false)
                        },
                      },
                      h('span', { className: `gb-theme-swatch is-${option.id}` }),
                      h(
                        'span',
                        { className: 'gb-theme-option-text' },
                        h('strong', null, t(option.label)),
                        h('small', null, t(option.hint)),
                      ),
                      theme === option.id ? h(Icon, { name: 'check', size: 12 }) : null,
                    ),
                  ),
                )
              : null,
          ),
          h(
            'span',
            { className: 'gb-topbar-pill' },
            h('span', { className: 'gb-signal' }),
            t('localLabel'),
          ),
          h(
            'span',
            { className: 'gb-topbar-pill gb-mono' },
            h(Icon, { name: 'computer', size: 11 }),
            t('localComputer'),
          ),
        ),
      )
    }

    function Composer({
      value,
      onChange,
      onSend,
      onStop,
      running,
      stopping,
      admin,
      theme,
      t,
      inputRef,
      sendMode,
      onToggleComputer,
      onToggleRail,
      onToggleVoice,
      onReset,
      onReplay,
      attachments,
      onUpload,
      onRemoveAttachment,
      uploading,
      onDictate,
      dictating,
      dictationAvailable,
      members,
      quote,
      onClearQuote,
      difficulty,
      onDifficulty,
      paths,
    }) {
      const [dragging, setDragging] = useState(false)
      const [templatesOpen, setTemplatesOpen] = useState(false)
      const fileRef = useRef(null)
      const attached = Array.isArray(attachments) ? attachments : []
      const memberList = Array.isArray(members) ? members : []
      const mentionMatch = memberList.length ? /(^|\s)@([^\s@]*)$/.exec(String(value || '')) : null
      const mentionQuery = mentionMatch ? mentionMatch[2].toLowerCase() : ''
      const mentionOptions = mentionMatch
        ? memberList.filter((member) => String(member.name || '').toLowerCase().includes(mentionQuery)).slice(0, 6)
        : []
      const pickMention = (member) => {
        const match = /(^|\s)@([^\s@]*)$/.exec(String(value || ''))
        if (!match || !member) return
        const prefix = String(value || '').slice(0, match.index) + (match[1] || '')
        onChange(`${prefix}@${member.name} `)
        inputRef?.current?.focus()
      }
      const templates = [
        { title: 'templateHomework', prompt: 'templateHomeworkPrompt', icon: 'computer' },
        { title: 'templateRead', prompt: 'templateReadPrompt', icon: 'search' },
        { title: 'templateCleanup', prompt: 'templateCleanupPrompt', icon: 'trash' },
        { title: 'templateReview', prompt: 'templateReviewPrompt', icon: 'activity' },
        { title: 'templateResearch', prompt: 'templateResearchPrompt', icon: 'search' },
        { title: 'templateWorkbench', prompt: 'templateWorkbenchPrompt', icon: 'computer' },
        { title: 'templateOcr', prompt: 'templateOcrPrompt', icon: 'file' },
        { title: 'templateCheckup', prompt: 'templateCheckupPrompt', icon: 'activity' },
        { title: 'templatePpt', prompt: 'templatePptPrompt', icon: 'file' },
        { title: 'templateDoc', prompt: 'templateDocPrompt', icon: 'file' },
        { title: 'templateSheet', prompt: 'templateSheetPrompt', icon: 'activity' },
        { title: 'templateGame', prompt: 'templateGamePrompt', icon: 'play' },
        { title: 'templateMusic', prompt: 'templateMusicPrompt', icon: 'speaker' },
        { title: 'templateVocational', prompt: 'templateVocationalPrompt', icon: 'computer' },
      ]
      const difficultyOptions = [
        { id: 'simple', label: 'difficultySimple' },
        { id: 'standard', label: 'difficultyStandard' },
        { id: 'hard', label: 'difficultyHard' },
      ]
      const applyTemplate = (template) => {
        const base = String(value || '').trim()
        let text = t(template.prompt)
        if (paths?.python) {
          text = text.replace(/\bpython\s+(?=scripts\/)/g, `"${paths.python}" `)
        }
        if (paths?.scripts) {
          text = text.replace(/scripts\/(?=(?:course|studio|edge|computer|ocr|sandbox|memory_search)\.py)/g, '')
          text = text.replace(/\b(course|studio|edge|computer|ocr|sandbox|memory_search)\.py\b/g, (name) => `"${paths.scripts}\\${name}"`)
        }
        onChange(base ? `${base}\n${text}` : text)
        setTemplatesOpen(false)
        requestAnimationFrame(() => inputRef?.current?.focus())
      }
      useEffect(() => {
        if (!templatesOpen) return undefined
        const close = (event) => {
          if (event.key === 'Escape') {
            setTemplatesOpen(false)
            return
          }
          if (event.type === 'pointerdown' && !event.target?.closest?.('.gb-template-menu, .gb-template-toggle')) {
            setTemplatesOpen(false)
          }
        }
        window.addEventListener('keydown', close)
        window.addEventListener('pointerdown', close)
        return () => {
          window.removeEventListener('keydown', close)
          window.removeEventListener('pointerdown', close)
        }
      }, [templatesOpen])
      const submit = () => {
        const text = String(value || '').trim()
        if (text || attached.length > 0) onSend(text, attached, difficulty)
      }

      const filesFromClipboard = (event) => {
        const items = Array.from(event.clipboardData?.items || [])
        const files = []
        for (const item of items) {
          if (item.kind !== 'file') continue
          const blob = item.getAsFile()
          if (!blob) continue
          const type = blob.type || item.type || 'application/octet-stream'
          const ext = type.includes('png') ? 'png' : type.includes('jpeg') ? 'jpg' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'bin'
          const base = blob.name && blob.name !== 'image.png' ? blob.name : `clipboard-${Date.now()}-${files.length + 1}.${ext}`
          files.push(new File([blob], base, { type, lastModified: Date.now() }))
        }
        return files
      }

      const handlePaste = (event) => {
        const files = filesFromClipboard(event)
        if (files.length === 0) return
        event.preventDefault()
        onUpload(files)
      }

      const handleDrop = (event) => {
        const files = Array.from(event.dataTransfer?.files || [])
        if (files.length === 0) return
        event.preventDefault()
        event.stopPropagation()
        setDragging(false)
        onUpload(files)
      }

      useEffect(() => {
        const onDragOver = (event) => {
          if (!Array.from(event.dataTransfer?.types || []).includes('Files')) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
          setDragging(true)
        }
        const onDragLeave = (event) => {
          if (!event.relatedTarget) setDragging(false)
        }
        const onDrop = (event) => {
          if (!event.dataTransfer?.files?.length || event.defaultPrevented) return
          event.preventDefault()
          setDragging(false)
          onUpload(event.dataTransfer.files)
        }
        const onPaste = (event) => {
          if (event.target?.closest?.('.gb-composer')) return
          const files = filesFromClipboard(event)
          if (files.length === 0) return
          event.preventDefault()
          onUpload(files)
        }
        document.addEventListener('dragover', onDragOver)
        document.addEventListener('dragleave', onDragLeave)
        document.addEventListener('drop', onDrop)
        document.addEventListener('paste', onPaste)
        return () => {
          document.removeEventListener('dragover', onDragOver)
          document.removeEventListener('dragleave', onDragLeave)
          document.removeEventListener('drop', onDrop)
          document.removeEventListener('paste', onPaste)
        }
      }, [onUpload])
      return h(
        'div',
        {
          className: 'gb-composer-wrap',
          style:
            theme === 'warm'
              ? { background: 'linear-gradient(to top, #f4ead8 58%, transparent)' }
              : theme === 'ink'
                ? { background: 'linear-gradient(to top, #f0eee7 58%, transparent)' }
                : undefined,
        },
        h(
          'div',
          {
            className: `gb-composer${running ? ' is-running' : ''}${dragging ? ' is-dragging' : ''}`,
            style:
              theme === 'warm'
                ? { background: '#fff8ec' }
                : theme === 'ink'
                  ? { background: '#fbfaf6' }
                  : undefined,
            onDragEnter: (event) => {
              if (Array.from(event.dataTransfer?.types || []).includes('Files')) {
                event.preventDefault()
                setDragging(true)
              }
            },
            onDragOver: (event) => {
              if (!Array.from(event.dataTransfer?.types || []).includes('Files')) return
              event.preventDefault()
              event.dataTransfer.dropEffect = 'copy'
              setDragging(true)
            },
            onDragLeave: (event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
            },
            onDrop: handleDrop,
            onPaste: handlePaste,
          },
          dragging
            ? h(
                'div',
                { className: 'gb-drop-overlay' },
                h(Icon, { name: 'paperclip', size: 15 }),
                h('span', null, t('dropHint')),
              )
            : null,
          h('input', {
            ref: fileRef,
            type: 'file',
            multiple: true,
            style: { display: 'none' },
            onChange: (event) => {
              if (event.target.files?.length) onUpload(event.target.files)
              event.target.value = ''
            },
          }),
          quote
            ? h(
                'div',
                { className: 'gb-compose-quote' },
                h(
                  'span',
                  { className: 'gb-compose-quote-label' },
                  `${t('quote')} ${quote.name || t('replyYou')}`,
                ),
                h('p', null, quote.text),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'gb-compose-quote-clear',
                    onClick: onClearQuote,
                    title: t('cancel'),
                    'aria-label': t('cancel'),
                  },
                  '×',
                ),
              )
            : null,
          attached.length > 0
            ? h(
                'div',
                { className: 'gb-attach-list' },
                attached.map((file) =>
                  h(
                    'span',
                    { className: 'gb-attach-chip', key: file.path || file.name },
                    file.preview
                      ? h('img', { className: 'gb-attach-thumb', src: file.preview, alt: file.name })
                      : h(Icon, { name: 'file', size: 11 }),
                    h('span', { className: 'gb-attach-name', title: file.path }, file.name),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'gb-attach-remove',
                        onClick: () => onRemoveAttachment(file.path),
                        title: t('removeAttachment'),
                        'aria-label': t('removeAttachment'),
                      },
                      '×',
                    ),
                  ),
                ),
              )
            : null,
          mentionOptions.length > 0
            ? h(
                'div',
                { className: 'gb-mention-pop' },
                mentionOptions.map((member) =>
                  h(
                    'button',
                    {
                      key: member.id,
                      type: 'button',
                      className: 'gb-mention-item',
                      onMouseDown: (event) => {
                        event.preventDefault()
                        pickMention(member)
                      },
                    },
                    h('span', { className: 'gb-mention-avatar' }, member.emoji || '◉'),
                    h('span', { className: 'gb-mention-name' }, member.name),
                    h('span', { className: 'gb-mention-role' }, member.modelLabel || ''),
                  ),
                ),
              )
            : null,
          h(
            'textarea',
            {
              ref: inputRef,
              className: 'gb-input',
              style:
                theme === 'warm'
                  ? { background: 'transparent', color: '#2f2418' }
                  : theme === 'ink'
                    ? { background: 'transparent', color: '#1d1c19' }
                    : undefined,
              value,
              rows: 1,
              placeholder: running ? t('inputBusy') : t('inputPlaceholder'),
              onChange: (event) => onChange(event.target.value),
              onKeyDown: (event) => {
                if (
                  (event.key === 'Enter' && !event.shiftKey) ||
                  event.key === 'Tab'
                ) {
                  if (mentionOptions.length > 0) {
                    event.preventDefault()
                    pickMention(mentionOptions[0])
                    return
                  }
                }
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent?.isComposing) {
                  event.preventDefault()
                  submit()
                }
              },
              'aria-label': t('inputPlaceholder'),
            },
          ),
          templatesOpen
            ? h(
                'div',
                { className: 'gb-template-menu' },
                h(
                  'div',
                  { className: 'gb-template-head' },
                  h(Icon, { name: 'spark', size: 13 }),
                  h('span', null, t('templateTitle')),
                ),
                templates.map((template) =>
                  h(
                    'button',
                    {
                      key: template.title,
                      type: 'button',
                      className: 'gb-template-item',
                      onClick: () => applyTemplate(template),
                    },
                    h(Icon, { name: template.icon, size: 14 }),
                    h('span', null, t(template.title)),
                  ),
                ),
              )
            : null,
          h(
            'div',
            { className: 'gb-composer-row' },
            h(
              'div',
              { className: 'gb-composer-hints' },
              h('span', { className: 'gb-hint' }, t('hint')),
              h('span', { className: 'gb-hint gb-hint-secondary' }, t('pasteHint')),
              h('span', { className: 'gb-hint gb-hint-secondary' }, running ? t('steerHint') : t('queueHint')),
            ),
            h(
              'div',
              { className: 'gb-composer-actions' },
              dictationAvailable
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: `gb-attach-btn${dictating ? ' is-listening' : ''}`,
                      onClick: onDictate,
                      title: dictating ? t('voiceStop') : t('dictate'),
                      'aria-label': dictating ? t('voiceStop') : t('dictate'),
                    },
                    h(Icon, { name: 'mic', size: 16 }),
                  )
                : null,
              h(
                'button',
                {
                  type: 'button',
                  className: 'gb-attach-btn',
                  onClick: () => fileRef.current?.click(),
                  disabled: uploading,
                  title: uploading ? t('uploading') : `${t('attach')} · ${t('pasteHint')}`,
                  'aria-label': t('attach'),
                },
                uploading ? h('span', { className: 'gb-attach-busy' }) : h(Icon, { name: 'paperclip', size: 17 }),
              ),
              running
                ? h(
                    'button',
                    { type: 'button', className: 'gb-stop-btn', onClick: onStop, disabled: stopping, title: t('stopHint'), 'aria-label': t('stop') },
                    h(Icon, { name: 'stop', size: 14 }),
                    h('span', null, stopping ? t('stopping') : t('stop')),
                  )
                : null,
              h(
                'button',
                {
                  type: 'button',
                  className: 'gb-send-btn',
                  onClick: submit,
                  disabled: (!String(value || '').trim() && attached.length === 0) || uploading,
                  title: sendMode === 'steer' ? t('steerHint') : t('send'),
                  'aria-label': t('send'),
                },
                h(Icon, { name: 'send', size: 17, strokeWidth: 2 }),
              ),
            ),
          ),
        ),
        h(
          'div',
          { className: 'gb-composer-foot' },
          h(
            'span',
            { className: 'gb-foot-left' },
            h('span', { className: 'gb-access-pill' }, h('span', { className: 'gb-signal' }), t('fullAccess')),
            admin
              ? h('span', { className: 'gb-admin-pill', title: t('adminModeHint') }, t('adminMode'))
              : null,
            h(
              'div',
              { className: 'gb-difficulty', role: 'group', 'aria-label': t('difficulty') },
              h('span', { className: 'gb-difficulty-label' }, t('difficulty')),
              difficultyOptions.map((option) =>
                h(
                  'button',
                  {
                    key: option.id,
                    type: 'button',
                    className: `gb-difficulty-btn is-${option.id}${difficulty === option.id ? ' is-active' : ''}`,
                    onClick: () => onDifficulty?.(option.id),
                    title: t(`${option.label}Hint`),
                    'aria-pressed': difficulty === option.id,
                  },
                  t(option.label),
                ),
              ),
            ),
            h(
              'button',
              { type: 'button', className: 'gb-foot-btn gb-template-toggle', onClick: () => setTemplatesOpen((open) => !open), title: t('templateTitle') },
              h(Icon, { name: 'spark', size: 11 }),
              t('template'),
            ),
            h(
              'button',
              { type: 'button', className: 'gb-foot-btn gb-rail-toggle', onClick: onToggleRail, title: t('tasks') },
              h(Icon, { name: 'menu', size: 11 }),
              t('tasks'),
            ),
            h(
              'button',
              { type: 'button', className: 'gb-foot-btn', onClick: onToggleComputer, title: t('computer') },
              h(Icon, { name: 'computer', size: 11 }),
              t('computer'),
            ),
            onReplay
              ? h(
                  'button',
                  { type: 'button', className: 'gb-foot-btn', onClick: onReplay, title: t('replay') },
                  h(Icon, { name: 'play', size: 11 }),
                  t('replay'),
                )
              : null,
            h(
              'button',
              { type: 'button', className: 'gb-foot-btn gb-foot-icon', onClick: onToggleVoice, title: t('voice') },
              h(Icon, { name: 'speaker', size: 11 }),
            ),
            h(
              'button',
              { type: 'button', className: 'gb-foot-btn gb-foot-icon', onClick: onReset, title: t('reset') },
              h(Icon, { name: 'refresh', size: 11 }),
            ),
          ),
          h('span', { className: 'gb-composer-note' }, t('sendHint')),
        ),
      )
    }

    function StatBar({ label, value, detail, t }) {
      const percent = Math.max(0, Math.min(100, Number(value) || 0))
      return h(
        'div',
        { className: 'gb-stat' },
        h('div', { className: 'gb-stat-head' }, h('span', null, label), h('span', { className: 'gb-mono' }, `${Math.round(percent)}%`)),
        h('div', { className: 'gb-bar' }, h('div', { className: 'gb-bar-fill', style: { width: `${percent}%` } })),
        detail ? h('div', { className: 'gb-stat-detail' }, detail) : null,
      )
    }

    function ScreenCard({ computer, t, onRefresh }) {
      const [imgError, setImgError] = useState(false)
      const [nonce, setNonce] = useState(0)
      const [share, setShare] = useState(null)
      const videoRef = useRef(null)
      const screen = computer?.screen || {}
      const stamp = screen.capturedAt || 0
      const tick = computer?.ts || 0

      useEffect(() => {
        setImgError(false)
      }, [tick, stamp])

      useEffect(() => {
        if (videoRef.current && share) {
          videoRef.current.srcObject = share
          videoRef.current.play?.().catch(() => undefined)
        }
      }, [share])

      useEffect(() => {
        return () => {
          if (share) {
            for (const track of share.getTracks()) track.stop()
          }
        }
      }, [share])

      const startShare = async () => {
        try {
          if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('getDisplayMedia unavailable')
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 2 }, audio: false })
          stream.getVideoTracks()[0]?.addEventListener('ended', () => setShare(null))
          setShare(stream)
        } catch (error) {
          onRefresh?.(error)
        }
      }

      const stopShare = () => {
        if (share) {
          for (const track of share.getTracks()) track.stop()
          setShare(null)
        }
      }

      const canShowImage = !imgError && screen.available && !share
      return h(
        'div',
        { className: 'gb-screen-card' },
        h(
          'div',
          { className: 'gb-screen' },
          canShowImage
            ? h('img', {
                key: `${tick}-${nonce}`,
                src: `${API_BASE}/screenshot?ts=${tick}-${nonce}`,
                alt: t('localComputer'),
                onError: () => setImgError(true),
              })
            : share
              ? h('video', { ref: videoRef, muted: true, playsInline: true, autoPlay: true })
              : h(
                  'div',
                  { className: 'gb-screen-empty' },
                  h(Orb, { size: 46 }),
                  h('div', { className: 'gb-screen-empty-title' }, t('screenUnavailable')),
                  h('div', { className: 'gb-screen-empty-sub' }, t('screenHint')),
                  h(
                    'button',
                    { type: 'button', className: 'gb-small-btn', onClick: startShare },
                    h(Icon, { name: 'computer', size: 14 }),
                    t('connectScreen'),
                  ),
                ),
          h('div', { className: 'gb-scan' }),
          h('div', { className: 'gb-screen-vignette' }),
          h(
            'div',
            { className: 'gb-screen-top' },
            h('span', null, 'SCREEN 01'),
            h('span', { className: 'gb-live-tag' }, h('span', { className: 'gb-signal' }), t('live')),
          ),
          h(
            'div',
            { className: 'gb-screen-bottom' },
            h('span', null, share ? t('connectScreen') : screen.sourceName || t('noScreen')),
            h(
              'span',
              { className: 'gb-screen-actions' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'gb-screen-btn',
                  onClick: () => {
                    setNonce((value) => value + 1)
                    setImgError(false)
                    onRefresh?.()
                  },
                  title: t('refresh'),
                },
                h(Icon, { name: 'refresh', size: 12 }),
              ),
              share
                ? h(
                    'button',
                    { type: 'button', className: 'gb-screen-btn', onClick: stopShare },
                    h(Icon, { name: 'close', size: 12 }),
                    t('disconnectScreen'),
                  )
                : screen.available && !imgError
                  ? null
                  : h(
                      'button',
                      { type: 'button', className: 'gb-screen-btn', onClick: startShare },
                      t('connectScreen'),
                    ),
            ),
          ),
        ),
        h('div', { className: 'gb-screen-note' }, t('screenLocalOnly')),
      )
    }

    function ComputerTab({ computer, t, onRefresh }) {
      const [showAllApps, setShowAllApps] = useState(false)
      const apps = computer?.apps || []
      const visibleApps = showAllApps ? apps : apps.slice(0, 5)
      return h(
        'div',
        { className: 'gb-deck-scroll' },
        h(ScreenCard, { computer, t, onRefresh }),
        h(
          'div',
          { className: 'gb-deck-section' },
          h(
            'div',
            { className: 'gb-deck-section-head' },
            h('span', null, t('stats')),
            h('span', { className: 'gb-mono gb-muted' }, computer ? formatClock(computer.ts) : '—'),
          ),
          h(StatBar, {
            label: t('cpu'),
            value: computer?.cpu?.percent,
            detail: computer?.cpu?.model ? truncateText(computer.cpu.model, 42) : '',
            t,
          }),
          h(StatBar, {
            label: t('memoryLabel'),
            value: computer?.memory?.percent,
            detail: computer?.memory ? `${formatBytes(computer.memory.used)} / ${formatBytes(computer.memory.total)}` : '',
            t,
          }),
          (computer?.disks || []).slice(0, 2).map((disk) =>
            h(StatBar, {
              key: disk.name,
              label: `${t('disk')} ${disk.name}:`,
              value: disk.percent,
              detail: `${formatBytes(disk.free)} ${t('diskFree')}`,
              t,
            }),
          ),
        ),
        h(
          'div',
          { className: 'gb-deck-section' },
          h(
            'div',
            { className: 'gb-deck-section-head' },
            h('span', null, t('apps')),
            h('span', { className: 'gb-mono gb-muted' }, t('appCount', { n: apps.length })),
          ),
          apps.length === 0
            ? h('div', { className: 'gb-deck-empty' }, t('noApps'))
            : h(
                'div',
                { className: 'gb-app-list' },
                visibleApps.map((app, index) =>
                  h(
                    'div',
                    { className: 'gb-app-row', key: `${app.pid}-${index}` },
                    h('span', { className: 'gb-app-dot' }),
                    h(
                      'span',
                      { className: 'gb-app-text' },
                      h('span', { className: 'gb-app-title' }, truncateText(app.title, 38)),
                      h('span', { className: 'gb-app-name' }, app.name),
                    ),
                    h('span', { className: 'gb-app-cpu' }, app.cpu ? `${app.cpu}s` : ''),
                  ),
                ),
                apps.length > 5
                  ? h(
                      'button',
                      { type: 'button', className: 'gb-more-btn', onClick: () => setShowAllApps((value) => !value) },
                      showAllApps ? t('collapse') : `${t('expand')} +${apps.length - 5}`,
                    )
                  : null,
              ),
        ),
        h(
          'div',
          { className: 'gb-deck-section' },
          h('div', { className: 'gb-deck-section-head' }, h('span', null, t('workspace'))),
          h(
            'button',
            {
              type: 'button',
              className: 'gb-path',
              onClick: async () => {
                if (await copyText(computer?.workspace || '')) onRefresh?.(t('copiedPath'))
              },
              title: computer?.workspace || '',
            },
            h(Icon, { name: 'folder', size: 13 }),
            h('span', null, computer?.workspace || '—'),
          ),
          h(
            'div',
            { className: 'gb-meta-line' },
            h('span', null, `${t('host')} ${computer?.host || '—'}`),
            h('span', null, `${t('modelLabel')} ${computer?.model || t('modelAuto')}`),
          ),
        ),
      )
    }

    function ActivityTab({ snap, t, onRetry, onUndo }) {
      const items = (snap?.items || []).filter((item) => item.kind === 'activity')
      const running = [...items].reverse().find((item) => item.status === 'running')
      const stats = snap?.stats
      const quality = snap?.quality
      const safety = snap?.safety
      return h(
        'div',
        { className: 'gb-deck-scroll' },
        h(
          'div',
          { className: 'gb-deck-section' },
          h('div', { className: 'gb-deck-section-head' }, h('span', null, t('stats'))),
          h(
            'div',
            { className: 'gb-stat-grid' },
            h('div', null, h('b', null, stats?.turns || 0), h('span', null, t('turns'))),
            h('div', null, h('b', null, stats?.toolCalls || 0), h('span', null, t('tools'))),
            h('div', null, h('b', null, formatTokens((stats?.inputTokens || 0) + (stats?.outputTokens || 0))), h('span', null, t('tokens'))),
            h('div', null, h('b', null, formatDuration(stats?.elapsedMs || 0)), h('span', null, t('elapsed'))),
          ),
        ),
        h(
          'div',
          { className: 'gb-deck-section' },
          h(
            'div',
            { className: 'gb-deck-section-head' },
            h('span', null, t('qualityTitle')),
            h('span', { className: 'gb-mono gb-muted' }, quality?.rate == null ? '—' : `${quality.rate}%`),
          ),
          h(
            'div',
            { className: 'gb-stat-grid' },
            h('div', null, h('b', null, quality?.total || 0), h('span', null, t('runs'))),
            h('div', null, h('b', null, quality?.verified || 0), h('span', null, t('verified'))),
            h('div', null, h('b', null, quality?.needsReview || 0), h('span', null, t('needsReview'))),
            h('div', null, h('b', null, quality?.failed || 0), h('span', null, t('failed'))),
            h('div', null, h('b', null, quality?.verifiedRate == null ? '—' : `${quality.verifiedRate}%`), h('span', null, t('verifiedRate'))),
          ),
          quality?.recent?.length
            ? h(
                'div',
                { className: 'gb-quality-list' },
                quality.recent.slice(0, 5).map((run) =>
                  h(
                    'div',
                    { className: 'gb-quality-row', key: run.id },
                    h('span', { className: `gb-quality-dot is-${run.status}` }),
                    h('span', { className: 'gb-quality-text' }, truncateText(run.prompt, 70)),
                    h(
                      'span',
                      { className: `gb-quality-verdict is-${run.verification?.status || 'none'}`, title: run.verification?.note || '' },
                      run.verification?.status === 'passed'
                        ? t('verdictPassed')
                        : run.verification?.status === 'failed'
                          ? t('verdictFailed')
                          : t('verdictReview'),
                    ),
                    h('span', { className: 'gb-quality-meta' }, `${run.steps || 0} ${t('steps')} · ${formatClock(run.endedAt || run.startedAt)}`),
                  ),
                ),
              )
            : h('div', { className: 'gb-deck-empty' }, t('noRuns')),
        ),
        h(
          'div',
          { className: 'gb-deck-section' },
          h(
            'div',
            { className: 'gb-deck-section-head' },
            h('span', null, t('safetyTitle')),
            h('span', { className: 'gb-mono gb-muted' }, safety?.snapshotCount || 0),
          ),
          safety?.snapshots?.length
            ? safety.snapshots.slice(0, 3).map((snapshot) =>
                h(
                  'div',
                  { className: 'gb-safety-row', key: snapshot.id },
                  h(
                    'div',
                    { className: 'gb-safety-main' },
                    h('b', null, truncateText(snapshot.reason || snapshot.kind, 80)),
                    h(
                      'small',
                      null,
                      `${snapshot.entries?.length || 0} ${t('snapshotFiles')} · ${snapshot.status}${
                        snapshot.restoredAt ? ` · ${t('restored')}` : ''
                      } · ${formatRelative(snapshot.at, t)}`,
                    ),
                  ),
                  snapshot.restoredAt
                    ? null
                    : h(
                        'button',
                        { type: 'button', className: 'gb-ghost-btn', onClick: () => onUndo?.(snapshot.id) },
                        h(Icon, { name: 'refresh', size: 11 }),
                        t('undoSnapshot'),
                      ),
                ),
              )
            : h('div', { className: 'gb-deck-empty' }, t('safetyEmpty')),
        ),
        running
          ? h(
              'div',
              { className: 'gb-current-tool' },
              h(Spinner, { size: 14 }),
              h('div', null, h('span', null, t('currentTool')), h('b', null, toolIntent(running, t))),
            )
          : null,
        h(
          'div',
          { className: 'gb-deck-section' },
          h('div', { className: 'gb-deck-section-head' }, h('span', null, t('runLog')), h('span', { className: 'gb-mono gb-muted' }, items.length)),
          items.length === 0
            ? h('div', { className: 'gb-deck-empty' }, t('noActivity'))
            : h(
                'div',
                { className: 'gb-log-list' },
                [...items].reverse().map((item) =>
                  h(
                    'div',
                    { className: 'gb-log-row', key: item.callId || item.seq },
                    h(
                      'span',
                      { className: `gb-log-status is-${item.status}` },
                      item.status === 'running' ? h(Spinner, { size: 10 }) : null,
                    ),
                    h(
                      'span',
                      { className: 'gb-log-text' },
                      h('b', null, toolIntent(item, t)),
                    ),
                    h('span', { className: 'gb-log-time' }, formatClock(item.time)),
                  ),
                ),
              ),
        ),
        snap?.thread?.error
          ? h(
              'div',
              { className: 'gb-deck-error' },
              h(Icon, { name: 'alert', size: 14 }),
              h('span', null, snap.thread.error),
              onRetry ? h('button', { type: 'button', className: 'gb-ghost-btn', onClick: onRetry }, t('retry')) : null,
            )
          : null,
      )
    }

    function MemoryTab({ t, onToast, botId }) {
      const [text, setText] = useState('')
      const [loaded, setLoaded] = useState(false)
      const [dirty, setDirty] = useState(false)
      const [saving, setSaving] = useState(false)
      const [path, setPath] = useState('')
      const [history, setHistory] = useState(null)
      const [selected, setSelected] = useState(null)
      const [diff, setDiff] = useState('')
      const [diffBusy, setDiffBusy] = useState(false)
      const [restoring, setRestoring] = useState(false)

      useEffect(() => {
        let alive = true
        setLoaded(false)
        setSelected(null)
        setDiff('')
        apiGet(`/memory${botId ? `?botId=${encodeURIComponent(botId)}` : ''}`)
          .then((data) => {
            if (!alive) return
            setText(data.text || '')
            setPath(data.path || '')
            setHistory(data.history || null)
            setLoaded(true)
          })
          .catch(() => {
            if (alive) setLoaded(true)
          })
        return () => {
          alive = false
        }
      }, [botId])

      const save = async () => {
        setSaving(true)
        try {
          const data = await apiPost('/memory', { text, botId })
          setText(data.text || '')
          setHistory(data.history || null)
          setDirty(false)
          onToast?.(t('memorySaved'))
        } catch (error) {
          onToast?.(`${t('memorySaveFailed')}: ${error.message}`)
        } finally {
          setSaving(false)
        }
      }

      const openDiff = async (commit) => {
        if (!commit?.sha) return
        setSelected(commit.sha)
        setDiffBusy(true)
        setDiff('')
        try {
          const suffix = botId ? `&botId=${encodeURIComponent(botId)}` : ''
          const data = await apiGet(`/memory/diff?sha=${encodeURIComponent(commit.sha)}${suffix}`)
          setDiff(data.diff || '')
        } catch (error) {
          setDiff(String(error.message || error))
        } finally {
          setDiffBusy(false)
        }
      }

      const restore = async (sha) => {
        if (!sha || restoring) return
        if (!window.confirm(`${t('memoryRestore')} ${sha}?`)) return
        setRestoring(true)
        try {
          const data = await apiPost('/memory/restore', { sha, botId })
          setText(data.text || '')
          setHistory(data.history || null)
          setDirty(false)
          onToast?.(t('memoryRestored'))
        } catch (error) {
          onToast?.(String(error.message || error))
        } finally {
          setRestoring(false)
        }
      }

      const commits = history?.commits || []
      return h(
        'div',
        { className: 'gb-deck-scroll' },
        h(
          'div',
          { className: 'gb-deck-section' },
          h('div', { className: 'gb-deck-section-head' }, h('span', null, t('memoryTitle'))),
          h('p', { className: 'gb-deck-copy' }, t('memoryHint')),
          h(
            'textarea',
            {
              className: 'gb-memory-input',
              value: text,
              placeholder: t('memoryPlaceholder'),
              onChange: (event) => {
                setText(event.target.value)
                setDirty(true)
              },
              disabled: !loaded,
            },
          ),
          h(
            'div',
            { className: 'gb-memory-actions' },
            h('span', { className: 'gb-mono gb-muted' }, path || t('memoryEmpty')),
            h(
              'button',
              { type: 'button', className: 'gb-small-btn', onClick: save, disabled: saving || !dirty },
              saving ? h(Spinner, { size: 12 }) : h(Icon, { name: 'check', size: 13 }),
              t('saveMemory'),
            ),
          ),
        ),
        h(
          'div',
          { className: 'gb-deck-section' },
          h(
            'div',
            { className: 'gb-deck-section-head' },
            h('span', null, t('memoryHistory')),
            history?.available ? h('span', { className: 'gb-mono gb-muted' }, `${commits.length}`) : null,
          ),
          h('p', { className: 'gb-deck-copy' }, history?.available ? t('memoryHistoryHint') : t('memoryNoGit')),
          history?.dirty ? h('div', { className: 'gb-memory-dirty' }, t('memoryDirty')) : null,
          commits.length === 0
            ? h(
                'div',
                { className: 'gb-team-empty' },
                h(Icon, { name: 'clock', size: 20 }),
                h('span', null, t('memoryHistoryEmpty')),
              )
            : h(
                'div',
                { className: 'gb-memory-history' },
                commits.map((commit) =>
                  h(
                    'button',
                    {
                      key: commit.sha,
                      type: 'button',
                      className: `gb-memory-commit${selected === commit.sha ? ' is-active' : ''}`,
                      onClick: () => openDiff(commit),
                    },
                    h('span', { className: 'gb-memory-commit-sha' }, commit.sha),
                    h('span', { className: 'gb-memory-commit-subject' }, commit.subject),
                    h('span', { className: 'gb-memory-commit-time' }, formatRelative(commit.at, t)),
                  ),
                ),
              ),
          selected
            ? h(
                'div',
                { className: 'gb-memory-diff-wrap' },
                h(
                  'div',
                  { className: 'gb-memory-diff-head' },
                  h('span', null, `${t('memoryDiff')} · ${selected}`),
                  h(
                    'button',
                    { type: 'button', className: 'gb-small-btn', disabled: restoring, onClick: () => restore(selected) },
                    restoring ? h(Spinner, { size: 11 }) : h(Icon, { name: 'arrowDown', size: 12 }),
                    t('memoryRestore'),
                  ),
                ),
                diffBusy
                  ? h('div', { className: 'gb-mono gb-muted' }, '…')
                  : h('pre', { className: 'gb-memory-diff' }, diff || t('memoryHistoryEmpty')),
              )
            : null,
        ),
      )
    }

    function TeamTab({ team, roster, assignments, onToast, onCreateTeam, t }) {
      const agents = Array.isArray(team) ? team : []
      const members = Array.isArray(roster) ? roster : []
      const [filter, setFilter] = useState('all')
      const [delegations, setDelegations] = useState(Array.isArray(assignments) ? assignments : [])
      const [total, setTotal] = useState(Array.isArray(assignments) ? assignments.length : 0)
      const [loading, setLoading] = useState(false)
      const pagedRef = useRef(false)
      const load = useCallback(async (nextFilter, nextOffset, append) => {
        setLoading(true)
        try {
          const query = new URLSearchParams({ limit: '8', offset: String(nextOffset) })
          if (nextFilter && nextFilter !== 'all') query.set('status', nextFilter)
          const data = await apiGet(`/team?${query.toString()}`)
          const page = Array.isArray(data.assignments) ? data.assignments : []
          setDelegations((current) => (append ? [...current, ...page] : page))
          setTotal(Number(data.total) || 0)
          pagedRef.current = append
        } catch {
          /* keep the last successful page */
        } finally {
          setLoading(false)
        }
      }, [])
      useEffect(() => {
        void load(filter, 0, false)
      }, [filter, load])
      useEffect(() => {
        const timer = setInterval(() => {
          if (!document.hidden && !pagedRef.current) void load(filter, 0, false)
        }, 5000)
        return () => clearInterval(timer)
      }, [filter, load])
      const retryAssignment = async (assignmentId) => {
        try {
          await apiPost('/assignment/retry', { assignmentId })
          onToast?.(t('assignmentRetried'))
          await load(filter, 0, false)
        } catch (error) {
          onToast?.(error.message)
        }
      }
      const statusLabel = (status) =>
        status === 'success'
          ? t('assignmentDone')
          : status === 'running'
            ? t('assignmentRunning')
            : status === 'aborted'
              ? t('assignmentAborted')
              : t('assignmentFailed')
      return h(
        'div',
        { className: 'gb-deck-scroll' },
        h(
          'div',
          { className: 'gb-deck-section' },
          h(
            'div',
            { className: 'gb-deck-section-head' },
            h('span', null, t('teamRosterTitle')),
            h('span', { className: 'gb-mono gb-muted' }, String(members.length)),
          ),
          h('p', { className: 'gb-deck-copy' }, t('teamRosterHint')),
          members.length === 0
            ? h(
                'div',
                { className: 'gb-team-empty' },
                h(Icon, { name: 'agents', size: 22 }),
                h('span', null, t('teamNoRoster')),
              )
            : h(
                'div',
                { className: 'gb-roster-list' },
                members.map((member) =>
                  h(
                    'div',
                    { className: 'gb-roster-row', key: member.id },
                    h('span', { className: 'gb-roster-emoji' }, member.emoji || '◉'),
                    h(
                      'span',
                      { className: 'gb-roster-text' },
                      h(
                        'span',
                        { className: 'gb-roster-name' },
                        member.name,
                        h(
                          'span',
                          { className: `gb-role-chip${member.role === 'lead' ? ' is-lead' : ''}` },
                          member.role === 'lead' ? t('teamLead') : t('teamMember'),
                        ),
                      ),
                      h(
                        'span',
                        { className: 'gb-roster-meta' },
                        `${member.tagline || ''}${member.modelLabel ? ` · ${member.modelLabel}` : ''}`,
                      ),
                    ),
                    h('span', { className: `gb-team-dot${member.running ? ' is-running' : ''}` }),
                  ),
                ),
              ),
          members.length <= 1 && onCreateTeam
            ? h(
                'button',
                { type: 'button', className: 'gb-small-btn gb-team-add', onClick: onCreateTeam },
                h(Icon, { name: 'agents', size: 12 }),
                t('welcomeTeamCta'),
              )
            : null,
        ),
        h(
          'div',
          { className: 'gb-deck-section' },
          h(
            'div',
            { className: 'gb-deck-section-head' },
            h('span', null, t('teamAssignmentsTitle')),
            h('span', { className: 'gb-mono gb-muted' }, `${delegations.length}/${total}`),
          ),
          h(
            'div',
            { className: 'gb-team-filters' },
            [
              ['all', t('teamFilterAll')],
              ['running', t('teamFilterRunning')],
              ['success', t('teamFilterSuccess')],
              ['failed', t('teamFilterFailed')],
            ].map(([key, label]) =>
              h(
                'button',
                {
                  key,
                  type: 'button',
                  className: `gb-team-filter${filter === key ? ' is-active' : ''}`,
                  onClick: () => setFilter(key),
                },
                label,
              ),
            ),
          ),
          delegations.length === 0
            ? h(
                'div',
                { className: 'gb-team-empty' },
                h(Icon, { name: 'clock', size: 20 }),
                h('span', null, t('teamNoAssignments')),
              )
            : h(
                'div',
                { className: 'gb-delegation-list' },
                delegations.map((assignment) =>
                  h(
                    'div',
                    { className: `gb-delegation-row is-${assignment.status}`, key: assignment.id },
                    h(
                      'div',
                      { className: 'gb-delegation-head' },
                      h('span', { className: 'gb-delegation-route' }, `${assignment.fromName} → ${assignment.toName}`),
                      h('span', { className: `gb-delegation-status is-${assignment.status}` }, statusLabel(assignment.status)),
                    ),
                    assignment.summary
                      ? h('span', { className: 'gb-delegation-summary' }, truncateText(assignment.summary, 120))
                      : null,
                    assignment.steps || assignment.durationMs
                      ? h(
                          'span',
                          { className: 'gb-delegation-stats' },
                          t('assignmentStats', {
                            steps: assignment.steps || 0,
                            duration: formatDuration(assignment.durationMs || 0),
                            tokens: formatTokens(assignment.tokens || 0),
                          }),
                        )
                      : null,
                    assignment.status === 'failed' || assignment.status === 'aborted'
                      ? h(
                          'div',
                          { className: 'gb-delegation-actions' },
                          assignment.retryCount
                            ? h(
                                'span',
                                { className: 'gb-delegation-retry-count' },
                                t('assignmentRetryCount', { n: assignment.retryCount }),
                              )
                            : null,
                          (Number(assignment.retryCount) || 0) < 3
                            ? h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'gb-delegation-retry',
                                  onClick: () => retryAssignment(assignment.id),
                                },
                                h(Icon, { name: 'refresh', size: 10 }),
                                t('retry'),
                              )
                            : null,
                        )
                      : null,
                  ),
                ),
              ),
          delegations.length < total
            ? h(
                'button',
                { type: 'button', className: 'gb-small-btn', disabled: loading, onClick: () => load(filter, delegations.length, true) },
                loading ? h(Spinner, { size: 11 }) : h(Icon, { name: 'arrowDown', size: 12 }),
                t('teamLoadMore'),
              )
            : null,
        ),
        h(
          'div',
          { className: 'gb-deck-section' },
          h('div', { className: 'gb-deck-section-head' }, h('span', null, t('teamTitle'))),
          h('p', { className: 'gb-deck-copy' }, t('teamHint')),
          agents.length === 0
            ? h(
                'div',
                { className: 'gb-team-empty' },
                h(Icon, { name: 'agents', size: 22 }),
                h('span', null, t('teamEmpty')),
              )
            : h(
                'div',
                { className: 'gb-team-list' },
                agents.map((agent) =>
                  h(
                    'div',
                    { className: 'gb-team-row', key: agent.id },
                    h('span', { className: `gb-team-dot${agent.status === 'running' ? ' is-running' : ''}` }),
                    h('span', { className: 'gb-team-id gb-mono' }, String(agent.id).replace(/^session-/, '').slice(0, 18)),
                    h('span', { className: 'gb-team-status' }, agent.status),
                  ),
                ),
              ),
        ),
      )
    }

    function clockText(value) {
      return String(value || '').slice(0, 5)
    }

    function scheduleText(routine, t) {
      const schedule = routine?.schedule || {}
      if (schedule.kind === 'daily') return t('dailyAt', { time: clockText(schedule.time) })
      if (schedule.kind === 'weekly') {
        const days = (schedule.weekdays || []).map((day) => t(`weekday${day}`)).join(' / ')
        return t('weeklyAt', { days, time: clockText(schedule.time) })
      }
      if (schedule.kind === 'every') {
        const seconds = Number(schedule.seconds || 0)
        if (seconds > 0 && seconds % 3600 === 0) return t('everyHours', { n: seconds / 3600 })
        return t('everyMinutes', { n: Math.max(1, Math.round(seconds / 60)) })
      }
      if (schedule.kind === 'cron') return t('cronAt', { expression: schedule.expression })
      return t('routineNoSchedule')
    }

    function RoutinesTab({ snap, t, onToast, onRefresh, onOpenThread, botId }) {
      const routines = Array.isArray(snap?.routines) ? snap.routines : []
      const [editing, setEditing] = useState(null)
      const [title, setTitle] = useState('')
      const [prompt, setPrompt] = useState('')
      const [kind, setKind] = useState('daily')
      const [time, setTime] = useState('09:00')
      const [weekdays, setWeekdays] = useState([1, 2, 3, 4, 5])
      const [interval, setIntervalValue] = useState(60)
      const [unit, setUnit] = useState('minutes')
      const [expression, setExpression] = useState('0 9 * * *')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')

      const beginNew = () => {
        setEditing({ id: null })
        setTitle('')
        setPrompt('')
        setKind('daily')
        setTime('09:00')
        setWeekdays([1, 2, 3, 4, 5])
        setIntervalValue(60)
        setUnit('minutes')
        setExpression('0 9 * * *')
        setError('')
      }

      const routinePresets = [
        {
          key: 'daily',
          icon: 'clock',
          title: t('routinePresetDailyTitle'),
          prompt: t('routinePresetDailyPrompt'),
          kind: 'daily',
          time: '18:30',
        },
        {
          key: 'weekly',
          icon: 'spark',
          title: t('routinePresetWeeklyTitle'),
          prompt: t('routinePresetWeeklyPrompt'),
          kind: 'weekly',
          time: '17:00',
          weekdays: [5],
        },
        {
          key: 'hourly',
          icon: 'refresh',
          title: t('routinePresetHourlyTitle'),
          prompt: t('routinePresetHourlyPrompt'),
          kind: 'every',
          intervalValue: 1,
          unit: 'hours',
        },
      ]

      const applyRoutinePreset = (preset) => {
        beginNew()
        setTitle(preset.title)
        setPrompt(preset.prompt)
        setKind(preset.kind)
        if (preset.time) setTime(preset.time)
        if (Array.isArray(preset.weekdays)) setWeekdays(preset.weekdays)
        if (preset.intervalValue) setIntervalValue(preset.intervalValue)
        if (preset.unit) setUnit(preset.unit)
      }

      const beginEdit = (routine) => {
        const schedule = routine.schedule || {}
        setEditing(routine)
        setTitle(routine.title || '')
        setPrompt(routine.prompt || '')
        setKind(schedule.kind || 'daily')
        setTime(clockText(schedule.time) || '09:00')
        setWeekdays(Array.isArray(schedule.weekdays) && schedule.weekdays.length ? schedule.weekdays : [1, 2, 3, 4, 5])
        const seconds = Number(schedule.seconds || 3600)
        if (seconds % 3600 === 0) {
          setIntervalValue(seconds / 3600)
          setUnit('hours')
        } else {
          setIntervalValue(Math.max(1, Math.round(seconds / 60)))
          setUnit('minutes')
        }
        setExpression(schedule.expression || '0 9 * * *')
        setError('')
      }

      const buildSchedule = () => {
        const clock = String(time || '').length === 5 ? `${time}:00` : String(time || '')
        if (kind === 'daily') return { kind, time: clock, time_zone: 'Asia/Shanghai' }
        if (kind === 'weekly') {
          return { kind, time: clock, weekdays, time_zone: 'Asia/Shanghai' }
        }
        if (kind === 'every') {
          const factor = unit === 'hours' ? 3600 : 60
          return { kind, seconds: Math.max(60, Math.round(Number(interval) || 0) * factor) }
        }
        return { kind, expression, time_zone: 'Asia/Shanghai' }
      }

      const save = async (runAfter = false) => {
        if (busy) return
        if (!String(title || '').trim()) {
          setError(t('routineNameRequired'))
          return
        }
        if (!String(prompt || '').trim()) {
          setError(t('routinePromptRequired'))
          return
        }
        setBusy(true)
        setError('')
        try {
          const payload = {
            id: editing?.id || undefined,
            botId,
            title: String(title).trim(),
            prompt: String(prompt).trim(),
            schedule: buildSchedule(),
            enabled: true,
          }
          const result = editing?.id
            ? await apiPost('/routine/update', payload)
            : await apiPost('/routine/create', payload)
          setEditing(null)
          await onRefresh?.()
          onToast?.(t('routineSaved'))
          if (runAfter && result?.routine?.id) {
            const run = await apiPost('/routine/run', { id: result.routine.id })
            onToast?.(t('routineRunning'))
            if (run?.threadId) await onOpenThread?.(run.threadId)
          }
        } catch (caught) {
          setError(caught?.message || String(caught))
        } finally {
          setBusy(false)
        }
      }

      const toggle = async (routine) => {
        if (busy) return
        setBusy(true)
        try {
          await apiPost('/routine/update', { id: routine.id, enabled: !routine.enabled })
          await onRefresh?.()
        } catch (caught) {
          onToast?.(`${t('routineError')}: ${caught.message}`)
        } finally {
          setBusy(false)
        }
      }

      const runNow = async (routine) => {
        if (busy) return
        setBusy(true)
        try {
          const result = await apiPost('/routine/run', { id: routine.id })
          onToast?.(t('routineRunning'))
          if (result?.threadId) await onOpenThread?.(result.threadId)
        } catch (caught) {
          onToast?.(`${t('routineError')}: ${caught.message}`)
        } finally {
          setBusy(false)
        }
      }

      const remove = async (routine) => {
        if (!window.confirm(t('routineDeleteConfirm'))) return
        setBusy(true)
        try {
          await apiPost('/routine/delete', { id: routine.id, keepThread: true })
          await onRefresh?.()
          onToast?.(t('routineDeleted'))
        } catch (caught) {
          onToast?.(`${t('routineError')}: ${caught.message}`)
        } finally {
          setBusy(false)
        }
      }

      return h(
        'div',
        { className: 'gb-deck-scroll' },
        h(
          'div',
          { className: 'gb-deck-section' },
          h(
            'div',
            { className: 'gb-deck-section-head' },
            h('span', null, t('routineTitle')),
            h(
              'button',
              { type: 'button', className: 'gb-small-btn', onClick: beginNew, disabled: busy },
              h(Icon, { name: 'plus', size: 12 }),
              t('routineNew'),
            ),
          ),
          h('p', { className: 'gb-deck-copy' }, t('routineHint')),
          editing
            ? h(
                'div',
                { className: 'gb-routine-form' },
                h(
                  'label',
                  { className: 'gb-field' },
                  h('span', null, t('routineName')),
                  h('input', { value: title, maxLength: 80, onChange: (event) => setTitle(event.target.value) }),
                ),
                h(
                  'label',
                  { className: 'gb-field' },
                  h('span', null, t('routinePrompt')),
                  h('textarea', {
                    value: prompt,
                    rows: 3,
                    maxLength: 16000,
                    onChange: (event) => setPrompt(event.target.value),
                    placeholder: t('routinePromptPlaceholder'),
                  }),
                ),
                h(
                  'label',
                  { className: 'gb-field' },
                  h('span', null, t('routineSchedule')),
                  h(
                    'select',
                    { value: kind, onChange: (event) => setKind(event.target.value) },
                    h('option', { value: 'daily' }, t('routineDaily')),
                    h('option', { value: 'weekly' }, t('routineWeekly')),
                    h('option', { value: 'every' }, t('routineEvery')),
                    h('option', { value: 'cron', disabled: true }, `${t('routineCron')} · ${t('routineCronUnsupported')}`),
                  ),
                ),
                kind === 'daily' || kind === 'weekly'
                  ? h(
                      'label',
                      { className: 'gb-field' },
                      h('span', null, t('routineTime')),
                      h('input', { type: 'time', value: time, onChange: (event) => setTime(event.target.value) }),
                    )
                  : null,
                kind === 'weekly'
                  ? h(
                      'div',
                      { className: 'gb-field' },
                      h('span', null, t('routineWeekdays')),
                      h(
                        'div',
                        { className: 'gb-weekdays' },
                        [1, 2, 3, 4, 5, 6, 7].map((day) =>
                          h(
                            'button',
                            {
                              key: day,
                              type: 'button',
                              className: `gb-weekday${weekdays.includes(day) ? ' is-active' : ''}`,
                              onClick: () =>
                                setWeekdays((current) =>
                                  current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort((a, b) => a - b),
                                ),
                            },
                            t(`weekday${day}`),
                          ),
                        ),
                      ),
                    )
                  : null,
                kind === 'every'
                  ? h(
                      'div',
                      { className: 'gb-field-row' },
                      h(
                        'label',
                        { className: 'gb-field' },
                        h('span', null, t('routineInterval')),
                        h('input', {
                          type: 'number',
                          min: 1,
                          value: interval,
                          onChange: (event) => setIntervalValue(event.target.value),
                        }),
                      ),
                      h(
                        'label',
                        { className: 'gb-field' },
                        h('span', null, '\u00a0'),
                        h(
                          'select',
                          { value: unit, onChange: (event) => setUnit(event.target.value) },
                          h('option', { value: 'minutes' }, t('routineMinutes')),
                          h('option', { value: 'hours' }, t('routineHours')),
                        ),
                      ),
                    )
                  : null,
                kind === 'cron'
                  ? h(
                      'label',
                      { className: 'gb-field' },
                      h('span', null, t('routineExpression')),
                      h('input', { value: expression, onChange: (event) => setExpression(event.target.value) }),
                    )
                  : null,
                error ? h('div', { className: 'gb-modal-error' }, h(Icon, { name: 'alert', size: 13 }), h('span', null, error)) : null,
                h(
                  'div',
                  { className: 'gb-routine-form-actions' },
                  h('button', { type: 'button', className: 'gb-ghost-btn', onClick: () => setEditing(null), disabled: busy }, t('cancel')),
                  h(
                    'button',
                    { type: 'button', className: 'gb-ghost-btn', onClick: () => save(true), disabled: busy },
                    h(Icon, { name: 'play', size: 12 }),
                    t('routineSaveRun'),
                  ),
                  h(
                    'button',
                    { type: 'button', className: 'gb-primary-btn', onClick: () => save(false), disabled: busy },
                    busy ? h(Spinner, { size: 12 }) : h(Icon, { name: 'check', size: 12 }),
                    t('routineSave'),
                  ),
                ),
              )
            : null,
          routines.length === 0
            ? h(
                EmptyState,
                {
                  icon: 'clock',
                  title: t('routineEmpty'),
                  hint: t('routineEmptyHint'),
                  className: 'gb-routine-empty',
                },
                h(
                  'div',
                  { className: 'gb-routine-presets' },
                  routinePresets.map((preset) =>
                    h(
                      'button',
                      {
                        key: preset.key,
                        type: 'button',
                        className: 'gb-routine-preset',
                        onClick: () => applyRoutinePreset(preset),
                        disabled: busy,
                      },
                      h(Icon, { name: preset.icon, size: 14 }),
                      h('span', null, preset.title),
                      h(Icon, { name: 'chevronRight', size: 12 }),
                    ),
                  ),
                ),
              )
            : h(
                'div',
                { className: 'gb-routine-list' },
                routines.map((routine) =>
                  h(
                    'div',
                    { key: routine.id, className: `gb-routine-card${routine.enabled ? '' : ' is-paused'}` },
                    h(
                      'div',
                      { className: 'gb-routine-main' },
                      h(
                        'div',
                        { className: 'gb-routine-head' },
                        h('span', { className: `gb-routine-dot${routine.enabled ? ' is-on' : ''}` }),
                        h('b', null, routine.title),
                        h('span', { className: 'gb-routine-schedule' }, scheduleText(routine, t)),
                      ),
                      h('div', { className: 'gb-routine-meta' }, routine.prompt),
                      h(
                        'div',
                        { className: 'gb-routine-foot' },
                        h('span', null, routine.enabled ? t('routineEnabled') : t('routinePaused')),
                        h('span', null, '·'),
                        h(
                          'span',
                          null,
                          routine.lastRunAt ? t('lastRun', { when: formatRelative(routine.lastRunAt, t) }) : t('neverRun'),
                        ),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'gb-routine-actions' },
                      h(
                        'button',
                        { type: 'button', className: 'gb-ghost-btn', onClick: () => runNow(routine), disabled: busy },
                        h(Icon, { name: 'spark', size: 12 }),
                        t('routineRun'),
                      ),
                      h(
                        'button',
                        { type: 'button', className: 'gb-ghost-btn', onClick: () => beginEdit(routine), disabled: busy },
                        h(Icon, { name: 'pencil', size: 12 }),
                        t('routineEdit'),
                      ),
                      h(
                        'button',
                        { type: 'button', className: 'gb-ghost-btn', onClick: () => toggle(routine), disabled: busy },
                        routine.enabled ? t('routinePaused') : t('routineEnabled'),
                      ),
                      h(
                        'button',
                        { type: 'button', className: 'gb-danger-btn gb-routine-delete', onClick: () => remove(routine), disabled: busy },
                        h(Icon, { name: 'trash', size: 12 }),
                      ),
                    ),
                  ),
                ),
              ),
        ),
      )
    }

    function SkillsTab({ skills, t, onRun, onDelete, onCapture, busy, captureBusy }) {
      const list = Array.isArray(skills) ? skills : []
      return h(
        'div',
        { className: 'gb-deck-scroll' },
        h(
          'div',
          { className: 'gb-deck-section' },
          h(
            'div',
            { className: 'gb-deck-section-head' },
            h('span', null, t('skillTitle')),
            h('span', { className: 'gb-mono gb-muted' }, list.length),
          ),
          h('p', { className: 'gb-deck-copy' }, t('skillHint')),
          h(
            'button',
            { type: 'button', className: 'gb-small-btn', onClick: onCapture, disabled: captureBusy },
            captureBusy ? h(Spinner, { size: 12 }) : h(Icon, { name: 'spark', size: 13 }),
            t('skillSaveCurrent'),
          ),
          list.length === 0
            ? h(EmptyState, { icon: 'spark', title: t('skillEmpty') })
            : h(
                'div',
                { className: 'gb-skill-list' },
                list.map((skill) =>
                  h(
                    'div',
                    { className: 'gb-skill-row', key: skill.id },
                    h('div', { className: 'gb-skill-main' }, h('b', null, skill.title), h('small', null, truncateText(skill.prompt, 110))),
                    h(
                      'div',
                      { className: 'gb-skill-meta' },
                      skill.auto ? h('span', { className: 'gb-skill-badge' }, t('skillAuto')) : null,
                      h('span', null, `${t('skillUses')} ${skill.uses || 0}`),
                      h(
                        'span',
                        null,
                        `${t('skillSuccessRate')} ${
                          (skill.successes || 0) + (skill.failures || 0) === 0
                            ? '—'
                            : `${Math.round(((skill.successes || 0) / ((skill.successes || 0) + (skill.failures || 0))) * 100)}%`
                        }`,
                      ),
                      (skill.workflow?.length || skill.steps?.length)
                        ? h('span', null, `${skill.workflow?.length || skill.steps.length} ${t('steps')}`)
                        : null,
                      skill.params?.length ? h('span', null, `${skill.params.length} ${t('params')}`) : null,
                    ),
                    h(
                      'div',
                      { className: 'gb-skill-actions' },
                      h(
                        'button',
                        { type: 'button', className: 'gb-small-btn', onClick: () => onRun(skill), disabled: busy === skill.id },
                        busy === skill.id ? h(Spinner, { size: 11 }) : h(Icon, { name: 'spark', size: 11 }),
                        t('skillRun'),
                      ),
                      h(
                        'button',
                        { type: 'button', className: 'gb-ghost-btn', onClick: () => onDelete(skill) },
                        h(Icon, { name: 'trash', size: 11 }),
                        t('skillDelete'),
                      ),
                    ),
                  ),
                ),
              ),
        ),
      )
    }

    function NotificationsTab({ t, onToast, onOpenThread }) {
      const [config, setConfig] = useState(null)
      const [budget, setBudget] = useState(null)
      const [meeting, setMeeting] = useState(null)
      const [historyQuery, setHistoryQuery] = useState('')
      const [busy, setBusy] = useState(false)
      useEffect(() => {
        let alive = true
        Promise.all([apiGet('/notify'), apiGet('/budget'), apiGet('/meeting')])
          .then(([notifyData, budgetData, meetingData]) => {
            if (!alive) return
            setConfig(notifyData.config || null)
            setBudget(budgetData.budget || null)
            setMeeting({
              enabled: meetingData.enabled !== false,
              weekdaysOnly: meetingData.weekdaysOnly === true,
              onlyWhenWork: meetingData.onlyWhenWork === true,
              running: meetingData.running === true,
              lastDate: meetingData.lastDate || '',
              lastSummary: meetingData.lastSummary || '',
              groupId: meetingData.groupId || '',
              history: Array.isArray(meetingData.history) ? meetingData.history : [],
            })
          })
          .catch((error) => onToast?.(error.message))
        return () => {
          alive = false
        }
      }, [onToast])

      if (!config || !budget) {
        return h('div', { className: 'gb-deck-scroll' }, h('div', { className: 'gb-deck-empty' }, h(Spinner, { size: 16 })))
      }
      const update = (patch) => setConfig((current) => ({ ...current, ...patch }))
      const save = async () => {
        setBusy(true)
        try {
          const data = await apiPost('/notify', config)
          const budgetData = await apiPost('/budget', budget)
          setConfig(data.config)
          setBudget(budgetData.budget)
          onToast?.(t('notifySaved'))
        } catch (error) {
          onToast?.(`${t('notifyFailed')}: ${error.message}`)
        } finally {
          setBusy(false)
        }
      }
      const test = async () => {
        setBusy(true)
        try {
          const data = await apiPost('/notify/test', config)
          if (data.ok) onToast?.(t('notifyTested'))
          else onToast?.(`${t('notifyFailed')}: ${data.error || ''}`)
        } catch (error) {
          onToast?.(`${t('notifyFailed')}: ${error.message}`)
        } finally {
          setBusy(false)
        }
      }
      const updateMeeting = async (patch) => {
        try {
          const data = await apiPost('/meeting/config', patch)
          setMeeting((current) => ({ ...(current || {}), ...data }))
          onToast?.(t('meetingSaved'))
        } catch (error) {
          onToast?.(`${t('meetingFailed')}: ${error.message}`)
        }
      }
      const runMeeting = async () => {
        try {
          const data = await apiPost('/meeting/run', { force: true })
          onToast?.(data.ok ? t('meetingRunStarted') : data.error || t('meetingFailed'))
        } catch (error) {
          onToast?.(`${t('meetingFailed')}: ${error.message}`)
        }
      }
      const exportMinutes = async () => {
        try {
          const data = await apiGet('/meeting/export')
          const blob = new Blob([data.markdown || ''], { type: 'text/markdown;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = data.filename || 'meeting-minutes.md'
          anchor.click()
          setTimeout(() => URL.revokeObjectURL(url), 2_000)
          onToast?.(t('meetingExported'))
        } catch (error) {
          onToast?.(`${t('meetingFailed')}: ${error.message}`)
        }
      }
      const historyRows = (meeting?.history || []).slice(1).filter((entry) => {
        const query = historyQuery.trim().toLowerCase()
        if (!query) return true
        return String(entry.date || '').includes(query) || String(entry.summary || '').toLowerCase().includes(query)
      })
      return h(
        'div',
        { className: 'gb-deck-scroll' },
        h(
          'div',
          { className: 'gb-deck-section' },
          h('div', { className: 'gb-deck-section-head' }, h('span', null, t('notifyTitle')), h('span', { className: 'gb-mono gb-muted' }, config.method)),
          h('p', { className: 'gb-deck-copy' }, t('notifyHint')),
          h(
            'label',
            { className: 'gb-field' },
            h('span', null, t('notifyEnabled')),
            h('select', { value: config.enabled ? '1' : '0', onChange: (event) => update({ enabled: event.target.value === '1' }) },
              h('option', { value: '1' }, t('notifyOn')),
              h('option', { value: '0' }, t('notifyOff')),
            ),
          ),
          h(
            'label',
            { className: 'gb-field' },
            h('span', null, t('notifyRemoteControl')),
            h(
              'select',
              { value: config.remoteControl ? '1' : '0', onChange: (event) => update({ remoteControl: event.target.value === '1' }) },
              h('option', { value: '1' }, t('notifyOn')),
              h('option', { value: '0' }, t('notifyOff')),
            ),
            h('small', null, t('notifyRemoteHint')),
          ),
          h(
            'label',
            { className: 'gb-field' },
            h('span', null, t('notifySuccessMode')),
            h(
              'select',
              { value: config.successMode || 'all', onChange: (event) => update({ successMode: event.target.value }) },
              h('option', { value: 'all' }, t('notifySuccessAll')),
              h('option', { value: 'failures' }, t('notifySuccessFailures')),
            ),
          ),
          h(
            'div',
            { className: 'gb-field-row' },
            h('label', { className: 'gb-field' }, h('span', null, t('notifyQuietStart')), h('input', { value: config.quietStart || '', onChange: (event) => update({ quietStart: event.target.value }), placeholder: '23:00' })),
            h('label', { className: 'gb-field' }, h('span', null, t('notifyQuietEnd')), h('input', { value: config.quietEnd || '', onChange: (event) => update({ quietEnd: event.target.value }), placeholder: '08:00' })),
          ),
          h(
            'label',
            { className: 'gb-field' },
            h('span', null, t('notifyInterval')),
            h('input', { type: 'number', min: 5, max: 300, value: config.minIntervalSec || 10, onChange: (event) => update({ minIntervalSec: Number(event.target.value) || 10 }) }),
          ),
          h(
            'label',
            { className: 'gb-field' },
            h('span', null, t('notifyMethod')),
            h('select', { value: config.method, onChange: (event) => update({ method: event.target.value }) },
              h('option', { value: 'smtp' }, t('notifySmtp')),
              h('option', { value: 'desktop' }, t('notifyDesktop')),
            ),
          ),
          config.method === 'smtp'
            ? h(
                'div',
                null,
                h('label', { className: 'gb-field' }, h('span', null, t('notifyEmail')), h('input', { value: config.email || '', onChange: (event) => update({ email: event.target.value }), placeholder: '123456@qq.com' })),
                h('label', { className: 'gb-field' }, h('span', null, t('notifyAuth')), h('input', { type: 'password', value: config.authCode || '', onChange: (event) => update({ authCode: event.target.value }), placeholder: 'QQ 邮箱 SMTP 授权码' })),
                h('label', { className: 'gb-field' }, h('span', null, t('notifyTo')), h('input', { value: config.to || '', onChange: (event) => update({ to: event.target.value }), placeholder: '123456@qq.com' })),
              )
            : h('label', { className: 'gb-field' }, h('span', null, t('notifyContact')), h('input', { value: config.contact || '', onChange: (event) => update({ contact: event.target.value }), placeholder: '文件传输助手' })),
          config.lastError ? h('div', { className: 'gb-deck-error' }, h(Icon, { name: 'alert', size: 13 }), h('span', null, config.lastError)) : null,
          h(
            'div',
            { className: 'gb-modal-foot-right' },
            h('button', { type: 'button', className: 'gb-ghost-btn', onClick: test, disabled: busy }, t('notifyTest')),
            h('button', { type: 'button', className: 'gb-primary-btn', onClick: save, disabled: busy }, busy ? h(Spinner, { size: 12 }) : h(Icon, { name: 'check', size: 12 }), t('notifySave')),
          ),
        ),
        h(
          'div',
          { className: 'gb-deck-section' },
          h('div', { className: 'gb-deck-section-head' }, h('span', null, t('notifyStatus'))),
          h('div', { className: 'gb-deck-copy' }, config.lastSentAt ? `${t('lastSent')} ${formatRelative(config.lastSentAt, t)}` : t('notifyNoSend')),
        ),
        h(
          'div',
          { className: 'gb-deck-section' },
          h(
            'div',
            { className: 'gb-deck-section-head' },
            h('span', null, t('meetingTitle')),
            h('span', { className: 'gb-mono gb-muted' }, meeting?.lastDate || '—'),
          ),
          h('p', { className: 'gb-deck-copy' }, t('meetingHint')),
          h(
            'label',
            { className: 'gb-field' },
            h('span', null, t('meetingEnabled')),
            h(
              'select',
              {
                value: meeting?.enabled === false ? '0' : '1',
                onChange: (event) => updateMeeting({ enabled: event.target.value === '1' }),
              },
              h('option', { value: '1' }, t('notifyOn')),
              h('option', { value: '0' }, t('notifyOff')),
            ),
          ),
          h(
            'label',
            { className: 'gb-field' },
            h('span', null, t('meetingWeekdaysOnly')),
            h(
              'select',
              {
                value: meeting?.weekdaysOnly ? '1' : '0',
                onChange: (event) => updateMeeting({ weekdaysOnly: event.target.value === '1' }),
              },
              h('option', { value: '0' }, t('meetingEveryDay')),
              h('option', { value: '1' }, t('meetingWorkdays')),
            ),
          ),
          h(
            'label',
            { className: 'gb-field' },
            h('span', null, t('meetingOnlyWhenWork')),
            h(
              'select',
              {
                value: meeting?.onlyWhenWork ? '1' : '0',
                onChange: (event) => updateMeeting({ onlyWhenWork: event.target.value === '1' }),
              },
              h('option', { value: '0' }, t('meetingAlways')),
              h('option', { value: '1' }, t('meetingWhenWork')),
            ),
          ),
          h(
            'button',
            { type: 'button', className: 'gb-small-btn', disabled: meeting?.running, onClick: runMeeting },
            meeting?.running ? h(Spinner, { size: 12 }) : h(Icon, { name: 'spark', size: 12 }),
            t('meetingRunNow'),
          ),
          meeting?.lastSummary
            ? h(
                'div',
                { className: 'gb-meeting-minutes' },
                h(
                  'div',
                  { className: 'gb-meeting-minutes-head' },
                  h('span', null, t('meetingLastMinutes')),
                  h('span', { className: 'gb-mono' }, meeting.lastDate || ''),
                ),
                h('p', null, truncateText(meeting.lastSummary, 600)),
                h(
                  'div',
                  { className: 'gb-meeting-actions' },
                  meeting.groupId && onOpenThread
                    ? h(
                        'button',
                        {
                          type: 'button',
                          className: 'gb-small-btn',
                          onClick: () => onOpenThread(meeting.groupId),
                        },
                        t('openMeetingGroup'),
                      )
                    : null,
                  h(
                    'button',
                    { type: 'button', className: 'gb-small-btn', onClick: exportMinutes },
                    h(Icon, { name: 'arrowDown', size: 11 }),
                    t('meetingExport'),
                  ),
                ),
              )
            : h('p', { className: 'gb-deck-copy' }, t('meetingNoMinutes')),
          (meeting?.history || []).length > 1
            ? h(
                'div',
                { className: 'gb-meeting-history' },
                h('div', { className: 'gb-meeting-history-head' }, h('span', null, t('meetingHistory'))),
                h('input', {
                  className: 'gb-meeting-search',
                  value: historyQuery,
                  placeholder: t('meetingSearch'),
                  onChange: (event) => setHistoryQuery(event.target.value),
                }),
                historyRows.length === 0
                  ? h('p', { className: 'gb-deck-copy' }, t('meetingNoMatch'))
                  : historyRows.map((entry) =>
                      h(
                        'details',
                        { key: entry.date, className: 'gb-meeting-history-item' },
                        h(
                          'summary',
                          null,
                          h('span', null, entry.date),
                          h('span', { className: 'gb-mono' }, t('meetingChars', { n: entry.summary.length })),
                        ),
                        h('p', null, entry.summary),
                      ),
                    ),
              )
            : null,
        ),
        h(
          'div',
          { className: 'gb-deck-section' },
          h('div', { className: 'gb-deck-section-head' }, h('span', null, t('budgetTitle'))),
          h('p', { className: 'gb-deck-copy' }, t('budgetHint')),
          h(
            'div',
            { className: 'gb-field-row' },
            h('label', { className: 'gb-field' }, h('span', null, t('budgetMinutes')), h('input', { type: 'number', min: 1, max: 1440, value: Math.round((budget.maxMs || 0) / 60000), onChange: (event) => setBudget({ ...budget, maxMs: (Number(event.target.value) || 1) * 60000 }) })),
            h('label', { className: 'gb-field' }, h('span', null, t('budgetTools')), h('input', { type: 'number', min: 1, max: 10000, value: budget.maxTools || 1, onChange: (event) => setBudget({ ...budget, maxTools: Number(event.target.value) || 1 }) })),
          ),
          h('label', { className: 'gb-field' }, h('span', null, t('budgetTokens')), h('input', { type: 'number', min: 1000, max: 50000000, step: 1000, value: budget.maxTokens || 1000, onChange: (event) => setBudget({ ...budget, maxTokens: Number(event.target.value) || 1000 }) })),
        ),
      )
    }

    function ComputerPanel({ snap, t, tab, setTab, onClose, onToast, onReset, botId, onOpenThread, onRefresh, onRunSkill, onDeleteSkill, onCaptureSkill, skillBusy, captureBusy, onUndo, onCreateTeam, theme }) {
      const [computer, setComputer] = useState(null)
      const [refreshTick, setRefreshTick] = useState(0)

      useEffect(() => {
        if (tab !== 'computer') return undefined
        let alive = true
        const load = async () => {
          try {
            const data = await apiGet(`/computer${botId ? `?botId=${encodeURIComponent(botId)}` : ''}`)
            if (alive) setComputer(data)
          } catch {
            /* telemetry is best-effort */
          }
        }
        load()
        const timer = setInterval(() => {
          if (!document.hidden) load()
        }, 6_000)
        return () => {
          alive = false
          clearInterval(timer)
        }
      }, [tab, refreshTick, botId])

      const refresh = (message) => {
        setRefreshTick((value) => value + 1)
        if (typeof message === 'string' && message) onToast?.(message)
      }

      return h(
        'aside',
        { className: 'gb-deck', 'aria-label': t('localComputer'), style: { background: theme === 'warm' ? '#fff8ec' : theme === 'ink' ? '#fbfaf6' : theme === 'aurora' ? '#0f1819' : theme === 'ember' ? '#1c1815' : '#0a0b09', zIndex: 100, isolation: 'isolate' } },
        h(
          'div',
          { className: 'gb-deck-head' },
          h(
            'div',
            { className: 'gb-deck-title' },
            h('span', { className: 'gb-kicker-small' }, t('localLabel')),
            h('span', { className: 'gb-deck-name' }, 'LOCAL COMPUTER'),
          ),
          h(
            'div',
            { className: 'gb-deck-head-right' },
            h('span', { className: 'gb-live-pill' }, h('span', { className: 'gb-signal' }), t('live')),
            h(
              'button',
              { type: 'button', className: 'gb-icon-btn gb-deck-close', onClick: onClose, 'aria-label': t('close') },
              h(Icon, { name: 'close', size: 15 }),
            ),
          ),
        ),
        h(
          'div',
          { className: 'gb-tabs' },
          [
            ['computer', 'computer'],
            ['activity', 'activity'],
            ['team', 'agents'],
            ['routines', 'clock'],
            ['skills', 'spark'],
            ['notify', 'send'],
            ['memory', 'brain'],
          ].map(([key, icon]) =>
            h(
              'button',
              {
                key,
                type: 'button',
                className: `gb-tab${tab === key ? ' is-active' : ''}`,
                onClick: () => setTab(key),
              },
              h(Icon, { name: icon, size: 14 }),
              h('span', null, t(key)),
            ),
          ),
        ),
        tab === 'computer'
          ? h(ComputerTab, { computer, t, onRefresh: refresh })
          : tab === 'activity'
            ? h(ActivityTab, { snap, t, onRetry: onReset, onUndo })
            : tab === 'team'
              ? h(TeamTab, { team: snap.team, roster: snap.roster, assignments: snap.assignments, onToast, onCreateTeam, t })
              : tab === 'routines'
                ? h(RoutinesTab, {
                    snap,
                    t,
                    onToast,
                    onRefresh,
                    onOpenThread,
                    botId,
                  })
                : tab === 'skills'
                  ? h(SkillsTab, {
                      skills: snap.skills,
                      t,
                      onRun: onRunSkill,
                      onDelete: onDeleteSkill,
                      onCapture: onCaptureSkill,
                      busy: skillBusy,
                      captureBusy,
                    })
                  : tab === 'notify'
                    ? h(NotificationsTab, { t, onToast, onOpenThread })
                    : h(MemoryTab, { t, onToast, botId }),
      )
    }

    function CheckpointCard({ checkpoint, t, onResume, busy }) {
      if (!checkpoint) return null
      const cleanPrompt = cleanProblemReason(checkpoint.prompt)
      const cleanError = cleanProblemReason(checkpoint.error)
      return h(
        'div',
        { className: 'gb-checkpoint' },
        h(
          'div',
          { className: 'gb-checkpoint-head' },
          h(Icon, { name: 'alert', size: 13 }),
          h('b', null, t('checkpointTitle')),
          h('span', { className: 'gb-mono gb-muted' }, formatRelative(checkpoint.at, t)),
        ),
        h('p', { className: 'gb-checkpoint-prompt' }, truncateText(cleanPrompt, 220)),
        cleanError ? h('p', { className: 'gb-checkpoint-error' }, truncateText(cleanError, 220)) : null,
        h(
          'div',
          { className: 'gb-checkpoint-actions' },
          h('span', { className: 'gb-checkpoint-hint' }, t('checkpointHint')),
          h(
            'button',
            { type: 'button', className: 'gb-small-btn', onClick: onResume, disabled: busy },
            busy ? h(Spinner, { size: 12 }) : h(Icon, { name: 'refresh', size: 12 }),
            t('resume'),
          ),
        ),
      )
    }

    function PendingPrompt({ question, approval, t, onAnswer, onApproval, onStop, onNative, submitting }) {
      const [answers, setAnswers] = useState({})

      useEffect(() => {
        setAnswers({})
      }, [question?.id])

      if (!question && !approval) return null

      const valueFor = (id) => answers[id] || { selected: [], custom: '' }
      const update = (id, patch) => {
        setAnswers((current) => ({
          ...current,
          [id]: { ...(current[id] || { selected: [], custom: '' }), ...patch },
        }))
      }
      const toggleOption = (item, label) => {
        const value = valueFor(item.id)
        if (item.multiSelect) {
          const selected = value.selected.includes(label)
            ? value.selected.filter((entry) => entry !== label)
            : [...value.selected, label]
          update(item.id, { selected })
          return
        }
        update(item.id, { selected: [label], custom: '' })
      }
      const setCustom = (item, custom) => {
        const value = valueFor(item.id)
        update(item.id, {
          custom,
          selected: item.multiSelect || !custom ? value.selected : [],
        })
      }
      const submit = () => {
        if (!question || submitting) return
        onAnswer(
          question.questions.map((item) => {
            const value = valueFor(item.id)
            return {
              id: item.id,
              selected: value.selected,
              ...(value.custom.trim() ? { custom: value.custom.trim() } : {}),
            }
          }),
        )
      }
      const skip = () => {
        if (!question || submitting) return
        onAnswer(question.questions.map((item) => ({ id: item.id, selected: [] })))
      }

      return h(
        'div',
        { className: 'gb-pending-wrap' },
        approval
          ? h(
              'div',
              { className: 'gb-pending is-approval' },
              h(
                'div',
                { className: 'gb-pending-head' },
                h('span', { className: 'gb-pending-kicker' }, t(approval.native ? 'approvalNativeKicker' : 'approvalKicker')),
                h('span', { className: 'gb-pending-title' }, t(approval.native ? 'approvalNativeTitle' : 'approvalTitle')),
              ),
              h(
                'div',
                { className: 'gb-pending-body' },
                h('div', { className: 'gb-pending-reason' }, h('span', null, `${approval.botName || t('tool_default')} · `), h('b', null, toolLabel(approval.toolName, t))),
                approval.reason ? h('p', null, approval.reason) : null,
                h('div', { className: 'gb-pending-hint' }, t(approval.native ? 'approvalNativeHint' : 'approvalHint')),
              ),
              h(
                'div',
                { className: 'gb-pending-actions' },
                approval.native
                  ? [
                      h(
                        'button',
                        { key: 'stop', type: 'button', className: 'gb-pending-btn', onClick: onStop, disabled: submitting },
                        t('stop'),
                      ),
                      h(
                        'button',
                        { key: 'native', type: 'button', className: 'gb-pending-btn is-primary', onClick: onNative },
                        h(Icon, { name: 'computer', size: 12 }),
                        t('approvalNativeOpen'),
                      ),
                    ]
                  : [
                      h(
                        'button',
                        { key: 'deny', type: 'button', className: 'gb-pending-btn', disabled: submitting, onClick: () => onApproval('rejected') },
                        t('approvalDeny'),
                      ),
                      h(
                        'button',
                        { key: 'allow', type: 'button', className: 'gb-pending-btn is-primary', disabled: submitting, onClick: () => onApproval('allowed-once') },
                        submitting ? h(Spinner, { size: 12 }) : null,
                        t('approvalAllow'),
                      ),
                    ],
              ),
            )
          : null,
        question
          ? h(
              'div',
              { className: 'gb-pending' },
              h(
                'div',
                { className: 'gb-pending-head' },
                h('span', { className: 'gb-pending-kicker' }, t('questionKicker')),
                h('span', { className: 'gb-pending-title' }, t('questionTitle')),
                h('span', { className: 'gb-pending-count' }, `${question.questions.length}`),
              ),
              h(
                'div',
                { className: 'gb-pending-body' },
                question.questions.map((item, index) =>
                  h(
                    'div',
                    { className: 'gb-question', key: item.id || index },
                    item.header ? h('div', { className: 'gb-question-header' }, item.header) : null,
                    h('div', { className: 'gb-question-text' }, item.question),
                    item.detail ? h('pre', { className: 'gb-question-detail' }, item.detail) : null,
                    item.multiSelect ? h('div', { className: 'gb-question-multi' }, t('questionMulti')) : null,
                    (item.options || []).length > 0
                      ? h(
                          'div',
                          { className: 'gb-question-options' },
                          item.options.map((option) =>
                            h(
                              'button',
                              {
                                type: 'button',
                                key: option.label,
                                className: `gb-question-option${valueFor(item.id).selected.includes(option.label) ? ' is-active' : ''}`,
                                onClick: () => toggleOption(item, option.label),
                                title: option.description || option.label,
                              },
                              h('span', { className: 'gb-option-mark' }, valueFor(item.id).selected.includes(option.label) ? '✓' : ''),
                              h('span', null, option.label),
                            ),
                          ),
                        )
                      : null,
                    h(
                      'label',
                      { className: 'gb-question-custom' },
                      h('span', null, t('questionOther')),
                      h('input', {
                        value: valueFor(item.id).custom,
                        placeholder: '…',
                        onChange: (event) => setCustom(item, event.target.value),
                      }),
                    ),
                  ),
                ),
                h('div', { className: 'gb-pending-hint' }, t('questionHint')),
              ),
              h(
                'div',
                { className: 'gb-pending-actions' },
                h(
                  'button',
                  { type: 'button', className: 'gb-pending-btn', disabled: submitting, onClick: skip },
                  t('questionSkip'),
                ),
                h(
                  'button',
                  { type: 'button', className: 'gb-pending-btn is-primary', disabled: submitting, onClick: submit },
                  submitting ? h(Spinner, { size: 12 }) : null,
                  submitting ? t('questionSubmitting') : t('questionSubmit'),
                ),
              ),
            )
          : null,
      )
    }

    function LoadingScreen({ t, error, onRetry }) {
      return h(
        'div',
        { className: 'gb-root gb-loading' },
        h('style', null, CSS),
        h(
          'div',
          { className: 'gb-loading-card' },
          h(Orb, { size: 74, working: true }),
          h('div', { className: 'gb-kicker' }, error ? t('backendDown') : t('loading')),
          h('h1', null, error ? t('backendDown') : t('welcomeTitle')),
          h('p', null, error ? t('backendHint') : t('welcomeSub')),
          error ? h('code', { className: 'gb-error-code' }, error) : null,
          h(
            'button',
            { type: 'button', className: 'gb-primary-btn', onClick: onRetry },
            h(Icon, { name: 'refresh', size: 16 }),
            t('reload'),
          ),
        ),
      )
    }

    function App({ ctx }) {
      const tick = useLocaleTick(ctx)
      const t = useCallback((key, params) => translate(ctx, key, params), [ctx, tick])
      const [booted, setBooted] = useState(false)
      const [bootError, setBootError] = useState(null)
      const [snap, setSnap] = useState(null)
      const [threadId, setThreadId] = useState(null)
      const [pending, setPending] = useState(null)
      const [draft, setDraft] = useState('')
      const [quoteTarget, setQuoteTarget] = useState(null)
      const [searchOpen, setSearchOpen] = useState(false)
      const [searchQuery, setSearchQuery] = useState('')
      const [searchScope, setSearchScope] = useState('thread')
      const [searchResults, setSearchResults] = useState([])
      const [searchBusy, setSearchBusy] = useState(false)
      const [pinnedOpen, setPinnedOpen] = useState(false)
      const [pinsOpen, setPinsOpen] = useState(false)
      const [replayOpen, setReplayOpen] = useState(false)
      const [theme, setTheme] = useState(() => {
        try {
          return localStorage.getItem('dsh-bot-theme') || 'dark'
        } catch {
          return 'dark'
        }
      })
      const [difficulty, setDifficulty] = useState(() => {
        try {
          return localStorage.getItem('dsh-bot-difficulty') || 'standard'
        } catch {
          return 'standard'
        }
      })
      const [pinsList, setPinsList] = useState([])
      const [dismissedUpdate, setDismissedUpdate] = useState(() => {
        try {
          return localStorage.getItem('dsh-bot-dismissed-update') || ''
        } catch {
          return ''
        }
      })
      const [stalled, setStalled] = useState(false)
      const progressRef = useRef({ at: Date.now(), key: '' })
      const [guideOpen, setGuideOpen] = useState(false)
      const [guideStep, setGuideStep] = useState(0)
      const closeGuide = useCallback(() => {
        try {
          localStorage.setItem('dsh-bot-guide-v1', '1')
        } catch {
          /* dismissal is optional */
        }
        setGuideOpen(false)
        setGuideStep(0)
      }, [])
      useEffect(() => {
        if (!booted) return
        try {
          if (!localStorage.getItem('dsh-bot-guide-v1')) {
            setGuideStep(0)
            setGuideOpen(true)
          }
        } catch {
          /* localStorage is optional */
        }
      }, [booted])
      const [pinsBusy, setPinsBusy] = useState(false)
      const [sending, setSending] = useState(false)
      const [stopping, setStopping] = useState(false)
      const [answerBusy, setAnswerBusy] = useState(false)
      const [resuming, setResuming] = useState(false)
      const [undoing, setUndoing] = useState(false)
      const [skillBusy, setSkillBusy] = useState(null)
      const [captureBusy, setCaptureBusy] = useState(false)
      const [attachments, setAttachments] = useState([])
      const [uploading, setUploading] = useState(false)
      const [catalog, setCatalog] = useState(null)
      const [botEditor, setBotEditor] = useState(null)
      const [groupEditor, setGroupEditor] = useState(null)
      const [offline, setOffline] = useState(false)
      const [toast, setToast] = useState(null)
      const [tab, setTab] = useState('computer')
      const [rightOpen, setRightOpen] = useState(() => {
        try {
          return window.innerWidth > 1500
        } catch {
          return false
        }
      })
      const [railOpen, setRailOpen] = useState(() => {
        try {
          if (window.innerWidth <= 1020) return false
          return localStorage.getItem(STORAGE_RAIL) !== '0'
        } catch {
          return false
        }
      })
      const [voice, setVoice] = useState(() => {
        try {
          return localStorage.getItem(STORAGE_VOICE) === '1'
        } catch {
          return false
        }
      })
      const [bootNonce, setBootNonce] = useState(0)
      const inputRef = useRef(null)
      const scrollRef = useRef(null)
      const stickRef = useRef(true)
      const prevRunningRef = useRef(false)
      const lastQuestionNotifiedRef = useRef(null)
      const lastSpokenSeqRef = useRef(0)
      const spokenReadyRef = useRef(false)
      const toastTimerRef = useRef(null)
      const noticePermissionRef = useRef(false)
      const [olderItems, setOlderItems] = useState([])
      const [historyHasMore, setHistoryHasMore] = useState(false)
      const [historyBusy, setHistoryBusy] = useState(false)
      const historyAnchorRef = useRef(null)

      const showToast = useCallback((message) => {
        setToast(message)
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        toastTimerRef.current = setTimeout(() => setToast(null), 3200)
      }, [])

      useEffect(() => {
        return () => {
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        }
      }, [])

      useEffect(() => {
        setOlderItems([])
        setHistoryHasMore(false)
        setQuoteTarget(null)
        setPinnedOpen(false)
        historyAnchorRef.current = null
      }, [threadId])

      useEffect(() => {
        if (olderItems.length === 0) setHistoryHasMore(Boolean(snap?.channelHistory?.hasMore))
      }, [snap?.channelHistory?.hasMore, threadId])

      useEffect(() => {
        const anchor = historyAnchorRef.current
        const element = scrollRef.current
        if (!anchor || !element) return
        element.scrollTop = element.scrollHeight - anchor.height + anchor.top
        historyAnchorRef.current = null
      }, [olderItems.length])

      useEffect(() => {
        const key = `${snap?.items?.length || 0}:${snap?.stream?.text?.length || 0}:${snap?.approval?.id || ''}:${snap?.question?.id || ''}`
        if (progressRef.current.key !== key) {
          progressRef.current = { at: Date.now(), key }
          setStalled(false)
        }
      }, [snap?.items?.length, snap?.stream?.text, snap?.approval?.id, snap?.question?.id])

      useEffect(() => {
        const isRunning = Boolean(snap?.thread?.running)
        if (!isRunning) {
          setStalled(false)
          return undefined
        }
        const timer = setInterval(() => {
          if (Date.now() - progressRef.current.at > 90_000) setStalled(true)
        }, 5_000)
        return () => clearInterval(timer)
      }, [snap?.thread?.running])

      const loadEarlier = useCallback(async () => {
        const channelId = snap?.channel?.id
        if (!channelId || historyBusy || !historyHasMore) return
        const cursor = olderItems.length
          ? Number(olderItems[0].time) || 0
          : Number(snap?.channelHistory?.oldestTime) || 0
        if (!cursor) return
        const element = scrollRef.current
        historyAnchorRef.current = element ? { height: element.scrollHeight, top: element.scrollTop } : null
        setHistoryBusy(true)
        try {
          const data = await apiGet(
            `/channel/messages?threadId=${encodeURIComponent(channelId)}&before=${cursor}&limit=40`,
          )
          const page = Array.isArray(data.messages) ? data.messages : []
          setOlderItems((current) => {
            const seen = new Set(current.map((item) => item.id))
            return [...page.filter((item) => !seen.has(item.id)), ...current]
          })
          setHistoryHasMore(Boolean(data.hasMore))
        } catch (error) {
          historyAnchorRef.current = null
          showToast(error.message)
        } finally {
          setHistoryBusy(false)
        }
      }, [snap, olderItems, historyBusy, historyHasMore, showToast])

      useEffect(() => {
        let alive = true
        setBooted(false)
        setBootError(null)
        apiGet('/bootstrap')
          .then((data) => {
            if (!alive) return
            setSnap(data)
            setThreadId(data.thread.id)
            setBooted(true)
            spokenReadyRef.current = false
          })
          .catch((error) => {
            if (alive) setBootError(error.message)
          })
        return () => {
          alive = false
        }
      }, [bootNonce])

      useEffect(() => {
        if (!threadId || !booted) return undefined
        let alive = true
        const tick = async () => {
          if (document.hidden) return
          try {
            const data = await apiGet(`/state?thread=${encodeURIComponent(threadId)}`)
            if (!alive) return
            setSnap(data)
            setOffline(false)
          } catch (error) {
            if (!alive) return
            setOffline(true)
            if (String(error?.message || '').includes('任务不存在')) {
              apiGet('/bootstrap')
                .then((data) => {
                  if (!alive || !data?.thread?.id) return
                  setSnap(data)
                  setThreadId(data.thread.id)
                  setOffline(false)
                })
                .catch(() => undefined)
            }
          }
        }
        tick()
        const timer = setInterval(tick, 900)
        const onVisible = () => {
          if (!document.hidden) tick()
        }
        document.addEventListener('visibilitychange', onVisible)
        return () => {
          alive = false
          clearInterval(timer)
          document.removeEventListener('visibilitychange', onVisible)
        }
      }, [threadId, booted])

      useEffect(() => {
        if (!pending || !snap) return
        const found = (snap.items || []).some(
          (item) => item.kind === 'user' && item.text === pending.text && item.time >= pending.at - 15_000,
        )
        if (found) setPending(null)
      }, [snap, pending])

      useEffect(() => {
        if (!pending) return undefined
        const timer = setTimeout(() => setPending(null), 20_000)
        return () => clearTimeout(timer)
      }, [pending])

      useEffect(() => {
        const element = scrollRef.current
        if (!element) return
        if (stickRef.current) element.scrollTop = element.scrollHeight
      }, [snap?.items?.length, snap?.stream?.text, snap?.approval?.id, snap?.question?.id, pending])

      useEffect(() => {
        const element = scrollRef.current
        if (!element) return undefined
        const onScroll = () => {
          stickRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 90
        }
        element.addEventListener('scroll', onScroll, { passive: true })
        return () => element.removeEventListener('scroll', onScroll)
      }, [booted])

      useEffect(() => {
        try {
          localStorage.setItem('dsh-bot-theme', theme)
        } catch {
          /* theme is optional */
        }
        document.documentElement.dataset.dshBotTheme = theme
      }, [theme])

      useEffect(() => {
        try {
          localStorage.setItem('dsh-bot-difficulty', difficulty)
        } catch {
          /* difficulty is optional */
        }
      }, [difficulty])

      useEffect(() => {
        const saved = snap?.thread?.difficulty
        if (saved === 'simple' || saved === 'standard' || saved === 'hard') {
          setDifficulty(saved)
        }
      }, [threadId, snap?.thread?.difficulty])

      useEffect(() => {
        const running = Boolean(snap?.thread?.running)
        const was = prevRunningRef.current
        prevRunningRef.current = running
        if (
          was &&
          !running &&
          document.hidden &&
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification(t('notifTitle'), { body: t('notifBody') })
          } catch {
            /* notifications are optional */
          }
        }
      }, [snap?.thread?.running, t])

      useEffect(() => {
        const question = snap?.question
        if (!question?.id) {
          lastQuestionNotifiedRef.current = null
          return
        }
        if (question.id === lastQuestionNotifiedRef.current) return
        lastQuestionNotifiedRef.current = question.id
        if (
          document.hidden &&
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification(t('questionTitle'), { body: question.question || t('questionTitle') })
          } catch {
            /* notifications are optional */
          }
        }
      }, [snap?.question?.id, t])

      useEffect(() => {
        const items = snap?.items || []
        const maxSeq = items.reduce((value, item) => Math.max(value, Number(item.seq) || 0), 0)
        if (!spokenReadyRef.current) {
          spokenReadyRef.current = true
          lastSpokenSeqRef.current = maxSeq
          return
        }
        if (voice) {
          const fresh = items.filter((item) => item.kind === 'assistant' && Number(item.seq) > lastSpokenSeqRef.current && item.text)
          if (fresh.length > 0) speakText(fresh[fresh.length - 1].text, t)
        }
        lastSpokenSeqRef.current = Math.max(lastSpokenSeqRef.current, maxSeq)
      }, [snap?.items, voice, t])

      useEffect(() => {
        try {
          localStorage.setItem(STORAGE_VOICE, voice ? '1' : '0')
        } catch {
          /* ignore */
        }
      }, [voice])

      useEffect(() => {
        try {
          localStorage.setItem(STORAGE_RAIL, railOpen ? '1' : '0')
        } catch {
          /* ignore */
        }
      }, [railOpen])

      const focusComposer = useCallback(() => {
        requestAnimationFrame(() => inputRef.current?.focus())
      }, [])

      const refreshSnapshot = useCallback(async () => {
        if (!threadId) return null
        try {
          const data = await apiGet(`/state?thread=${encodeURIComponent(threadId)}`)
          setSnap(data)
          setOffline(false)
          return data
        } catch (error) {
          showToast(error.message)
          return null
        }
      }, [showToast, threadId])

      const undoSnapshot = useCallback(async (id) => {
        if (!id || undoing) return
        setUndoing(true)
        try {
          await apiPost('/snapshot/restore', { id })
          showToast(t('undoDone'))
          await refreshSnapshot()
        } catch (error) {
          showToast(`${t('undoFailed')}: ${error.message}`)
        } finally {
          setUndoing(false)
        }
      }, [refreshSnapshot, showToast, t, undoing])

      const openThread = useCallback(
        async (id) => {
          if (!id) return
          setThreadId(id)
          setPending(null)
          setRailOpen(false)
          spokenReadyRef.current = false
          try {
            const data = await apiPost('/open', { threadId: id })
            setSnap(data)
            setOffline(false)
            focusComposer()
          } catch (error) {
            showToast(error.message)
          }
        },
        [focusComposer, showToast],
      )

      const renameThread = useCallback(
        async (title) => {
          if (!threadId || !title) return
          try {
            const data = await apiPost('/thread/rename', { threadId, title })
            const updated = data.thread
            setSnap((current) => {
              if (!current || !updated) return current
              return {
                ...current,
                thread: { ...(current.thread || {}), ...updated },
                threads: (current.threads || []).map((item) =>
                  item.id === updated.id ? { ...item, ...updated } : item,
                ),
                channel: current.channel ? { ...current.channel, name: title } : current.channel,
              }
            })
            showToast(t('renamed'))
          } catch (error) {
            showToast(error.message)
          }
        },
        [threadId, showToast, t],
      )

      const pinThread = useCallback(
        async (thread) => {
          if (!thread?.id) return
          try {
            const data = await apiPost('/thread/pin', { threadId: thread.id, pinned: !thread.pinned })
            setSnap((current) =>
              current
                ? {
                    ...current,
                    threads: (current.threads || []).map((item) =>
                      item.id === data.thread.id ? { ...item, ...data.thread } : item,
                    ),
                  }
                : current,
            )
          } catch (error) {
            showToast(error.message)
          }
        },
        [showToast],
      )

      const reorderThreads = useCallback(
        async (threadIds) => {
          if (!Array.isArray(threadIds) || threadIds.length === 0) return
          try {
            const data = await apiPost('/thread/reorder', { threadIds })
            setSnap((current) => (current ? { ...current, threads: data.threads || current.threads } : current))
          } catch (error) {
            showToast(error.message)
          }
        },
        [showToast],
      )

      const archiveThread = useCallback(
        async (archived) => {
          if (!threadId) return
          try {
            await apiPost('/thread/archive', { threadId, archived })
            const next = archived ? await apiGet('/bootstrap') : await apiPost('/open', { threadId })
            setSnap(next)
            setThreadId(next.thread.id)
            showToast(archived ? t('archived') : t('unarchived'))
          } catch (error) {
            showToast(error.message)
          }
        },
        [threadId, showToast, t],
      )

      const resumeCheckpoint = useCallback(async () => {
        if (!threadId || resuming) return
        setResuming(true)
        try {
          await apiPost('/resume', { threadId })
          setSnap((current) => (current ? { ...current, checkpoint: null } : current))
          showToast(t('resumed'))
        } catch (error) {
          showToast(error.message)
        } finally {
          setResuming(false)
        }
      }, [resuming, showToast, t, threadId])

      const captureSkill = useCallback(async () => {
        if (!threadId || captureBusy) return
        setCaptureBusy(true)
        try {
          const data = await apiPost('/skill/capture', { threadId })
          setSnap((current) => (current ? { ...current, skills: data.skills, quality: current.quality } : current))
          showToast(t('skillSaved'))
        } catch (error) {
          showToast(`${t('skillSaveFailed')}: ${error.message}`)
        } finally {
          setCaptureBusy(false)
        }
      }, [captureBusy, showToast, t, threadId])

      const runSkill = useCallback(
        async (skill) => {
          if (!skill || skillBusy) return
          setSkillBusy(skill.id)
          try {
            const data = await apiPost('/skill/run', { id: skill.id })
            await openThread(data.threadId)
            setRightOpen(false)
            showToast(t('skillRunning'))
          } catch (error) {
            showToast(`${t('skillRunFailed')}: ${error.message}`)
          } finally {
            setSkillBusy(null)
          }
        },
        [openThread, showToast, skillBusy, t],
      )

      const deleteSkill = useCallback(async (skill) => {
        if (!skill) return
        try {
          const data = await apiPost('/skill/delete', { id: skill.id })
          setSnap((current) => (current ? { ...current, skills: data.skills } : current))
          showToast(t('skillDeleted'))
        } catch (error) {
          showToast(error.message)
        }
      }, [showToast, t])

      const createTask = useCallback(async () => {
        try {
          const data = await apiPost('/new', {})
          setSnap(data)
          setThreadId(data.thread.id)
          setDraft('')
          setPending(null)
          spokenReadyRef.current = false
          setRailOpen(false)
          focusComposer()
        } catch (error) {
          showToast(`${t('newTaskFailed')}: ${error.message}`)
        }
      }, [focusComposer, showToast, t])

      const selectBot = useCallback(
        async (botId) => {
          if (!botId) return
          try {
            const data = await apiPost('/bot/select', { botId })
            setSnap(data)
            setThreadId(data.thread.id)
            setDraft('')
            setPending(null)
            setAttachments([])
            spokenReadyRef.current = false
            focusComposer()
          } catch (error) {
            showToast(error.message)
          }
        },
        [focusComposer, showToast],
      )

      const openBotEditor = useCallback(
        async (bot) => {
          setBotEditor(bot || { id: null, name: '', emoji: '◉' })
          if (catalog) return
          try {
            const data = await apiGet('/catalog')
            setCatalog(data)
          } catch (error) {
            setCatalog({ presets: [], providers: [] })
            showToast(`${t('catalogFailed')}: ${error.message}`)
          }
        },
        [catalog, showToast, t],
      )

      const saveGroup = useCallback(
        async (data) => {
          const payload = {
            name: data.name,
            emoji: data.emoji,
            memberIds: data.memberIds,
          }
          if (data.threadId) {
            const next = await apiPost('/channel/update', { threadId: data.threadId, ...payload })
            setSnap(next)
            setThreadId(next.thread.id)
            setGroupEditor(null)
            showToast(t('groupUpdated'))
          } else {
            const next = await apiPost('/channel/create', payload)
            setSnap(next)
            setThreadId(next.thread.id)
            setGroupEditor(null)
            setDraft('')
            setPending(null)
            setAttachments([])
            showToast(t('groupCreated'))
          }
        },
        [showToast, t],
      )

      const deleteGroup = useCallback(
        async (group) => {
          if (!group?.id) return
          const next = await apiPost('/channel/delete', { threadId: group.id })
          setSnap(next)
          setThreadId(next.thread.id)
          setGroupEditor(null)
          setDraft('')
          setPending(null)
          setAttachments([])
          showToast(t('groupDeleted'))
        },
        [showToast, t],
      )

      const openGroupEditor = useCallback(
        (group) => {
          setGroupEditor(group || { id: null, name: '', emoji: '◈', memberIds: [] })
        },
        [],
      )

      const addSpecialist = useCallback(() => {
        openBotEditor({ id: null, name: '', emoji: '🤖', tagline: '', persona: '', role: 'member' })
      }, [openBotEditor])

      const retryModel = useCallback(async () => {
        try {
          await apiPost('/model/refresh', {})
          const boot = await apiGet('/bootstrap')
          setSnap(boot)
          showToast(boot.modelReady ? t('modelConnected') : t('modelMissingHint'))
        } catch (error) {
          showToast(error.message)
        }
      }, [showToast, t])

      const insertMention = useCallback((name) => {
        setDraft((previous) => {
          const base = previous && !previous.endsWith(' ') ? `${previous} ` : previous
          return `${base}@${name} `
        })
        requestAnimationFrame(() => inputRef.current?.focus())
      }, [])

      const saveBot = useCallback(
        async (data) => {
          try {
            if (data.id) {
              const saved = await apiPost('/bot/update', { ...data, botId: data.id })
              await refreshSnapshot()
              setBotEditor(null)
              if (saved?.privilege && saved.privilege.ok === false) {
                showToast(`${t('botUpdated')} · ${t('privilegeLiveFailed')}: ${saved.privilege.error || ''}`)
              } else {
                showToast(t('botUpdated'))
              }
            } else {
              const next = await apiPost('/bot/create', data)
              setSnap(next)
              setThreadId(next.thread.id)
              setBotEditor(null)
              setDraft('')
              setPending(null)
              setAttachments([])
              showToast(t('botCreated'))
            }
          } catch (error) {
            throw error
          }
        },
        [refreshSnapshot, showToast, t],
      )

      const deleteBot = useCallback(
        async (bot) => {
          if (!bot?.id) return
          try {
            const next = await apiPost('/bot/delete', { botId: bot.id })
            setSnap(next)
            setThreadId(next.thread.id)
            setBotEditor(null)
            setDraft('')
            setPending(null)
            setAttachments([])
            showToast(t('botDeleted'))
          } catch (error) {
            throw error
          }
        },
        [showToast, t],
      )

      useEffect(() => {
        const onKey = (event) => {
          if ((event.ctrlKey || event.metaKey) && !event.shiftKey && String(event.key).toLowerCase() === 'n') {
            event.preventDefault()
            createTask()
          }
          if ((event.ctrlKey || event.metaKey) && event.shiftKey && String(event.key).toLowerCase() === 'c') {
            event.preventDefault()
            setRightOpen((value) => !value)
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [createTask])

      const deleteTask = useCallback(
        async (thread) => {
          if (!thread) return
          if (!window.confirm(t('deleteConfirm'))) return
          try {
            await apiPost('/delete', { threadId: thread.id })
            const data = await apiGet('/bootstrap')
            setSnap(data)
            setThreadId(data.thread.id)
            setPending(null)
            spokenReadyRef.current = false
          } catch (error) {
            showToast(error.message)
          }
        },
        [showToast, t],
      )

      const resetTask = useCallback(async () => {
        if (!threadId) return
        if (!window.confirm(t('resetConfirm'))) return
        try {
          const data = await apiPost('/reset', { threadId })
          setSnap(data)
          setPending(null)
          spokenReadyRef.current = false
          showToast(t('sessionReset'))
        } catch (error) {
          showToast(`${t('resetFailed')}: ${error.message}`)
        }
      }, [showToast, t, threadId])

      const requestNotifications = useCallback(() => {
        if (noticePermissionRef.current) return
        noticePermissionRef.current = true
        try {
          if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => undefined)
          }
        } catch {
          /* ignore */
        }
      }, [])

      const uploadFiles = useCallback(
        async (fileList) => {
          const files = Array.from(fileList || []).slice(0, 6)
          if (files.length === 0) return
          setUploading(true)
          for (const file of files) {
            if (file.size > 20 * 1024 * 1024) {
              showToast(t('uploadTooLarge'))
              continue
            }
            try {
              const data = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(String(reader.result || ''))
                reader.onerror = () => reject(reader.error || new Error('read failed'))
                reader.readAsDataURL(file)
              })
              const result = await apiPost('/upload', { name: file.name, data })
              const preview = String(file.type || '').startsWith('image/') && data.length <= 6_000_000 ? data : null
              setAttachments((previous) =>
                [...previous, { name: result.name, path: result.path, bytes: result.bytes, preview }].slice(0, 8),
              )
            } catch (error) {
              showToast(`${t('uploadFailed')}: ${error.message}`)
            }
          }
          setUploading(false)
        },
        [showToast, t],
      )

      const removeAttachment = useCallback((target) => {
        setAttachments((previous) => previous.filter((file) => file.path !== target))
      }, [])

      const dictationAvailable = Boolean(snap?.voiceAvailable)
      const [dictating, setDictating] = useState(false)

      const toggleDictation = useCallback(async () => {
        const next = !dictating
        if (next) inputRef.current?.focus()
        try {
          await apiPost('/voice', { action: next ? 'start' : 'stop' })
          setDictating(next)
          inputRef.current?.focus()
          showToast(next ? t('voiceStarted') : t('voiceStopped'))
        } catch (error) {
          showToast(`${t('voiceFailed')}: ${error.message}`)
        }
      }, [dictating, inputRef, showToast, t])

      const quoteMessage = useCallback((item) => {
        if (!item?.id) return
        setQuoteTarget({
          id: item.id,
          name: item.speaker?.name || '',
          text: truncateText(item.text || '', 160),
        })
        inputRef.current?.focus()
      }, [])

      const pinChatMessage = useCallback(
        async (item) => {
          if (!threadId) return
          const existing = item
            ? (snap?.thread?.pinnedMessages || []).some((entry) => entry.id === item.id)
            : false
          const action = item ? (existing ? 'remove' : 'add') : 'clear'
          try {
            const data = await apiPost('/message/pin', {
              threadId,
              messageId: item?.id || null,
              action,
              text: item?.text || '',
              name: item?.speaker?.name || '',
              role: item?.kind || '',
              time: item?.time || 0,
            })
            setSnap((current) =>
              current
                ? {
                    ...current,
                    thread: {
                      ...(current.thread || {}),
                      pinnedMessage: data.pinnedMessage || null,
                      pinnedMessages: Array.isArray(data.pinnedMessages) ? data.pinnedMessages : [],
                    },
                  }
                : current,
            )
            showToast(action === 'add' ? t('pinSaved') : t('unpinSaved'))
          } catch (error) {
            showToast(error.message)
          }
        },
        [snap, threadId, showToast, t],
      )

      useEffect(() => {
        if (!searchOpen) return undefined
        const query = searchQuery.trim()
        if (!query) {
          setSearchResults([])
          return undefined
        }
        let alive = true
        const timer = setTimeout(async () => {
          setSearchBusy(true)
          try {
            const params = new URLSearchParams({ q: query, limit: '40' })
            if (searchScope === 'all') params.set('scope', 'all')
            else if (threadId) params.set('threadId', threadId)
            const data = await apiGet(`/search?${params.toString()}`)
            if (alive) setSearchResults(Array.isArray(data.results) ? data.results : [])
          } catch {
            if (alive) setSearchResults([])
          } finally {
            if (alive) setSearchBusy(false)
          }
        }, 250)
        return () => {
          alive = false
          clearTimeout(timer)
        }
      }, [searchOpen, searchQuery, searchScope, threadId])

      useEffect(() => {
        const onKeyDown = (event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault()
            setSearchScope('all')
            setSearchOpen(true)
          }
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
            event.preventDefault()
            setSearchOpen(true)
          }
          if (event.key === 'Escape') setSearchOpen(false)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
      }, [])

      const jumpToMessage = useCallback((messageId) => {
        if (!messageId) return false
        const target = document.getElementById(`gb-msg-${messageId}`)
        if (!target) return false
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        target.classList.add('is-flash')
        setTimeout(() => target.classList.remove('is-flash'), 1400)
        return true
      }, [])

      const openSearchResult = useCallback(
        async (item) => {
          setSearchOpen(false)
          if (item.kind === 'memory') {
            await selectBot(item.botId)
            setTab('memory')
            setRightOpen(true)
            return
          }
          if (item.kind === 'thread') {
            await openThread(item.threadId)
            return
          }
          if (item.threadId && item.threadId !== threadId) {
            await openThread(item.threadId)
            setTimeout(() => {
              if (!jumpToMessage(item.id)) showToast(t('searchNotLoaded'))
            }, 420)
            return
          }
          setTimeout(() => {
            if (!jumpToMessage(item.id)) showToast(t('searchNotLoaded'))
          }, 60)
        },
        [jumpToMessage, openThread, selectBot, showToast, t, threadId],
      )

      const exportThread = useCallback(async () => {
        if (!threadId) return
        try {
          const data = await apiGet(`/export?threadId=${encodeURIComponent(threadId)}`)
          const blob = new Blob([data.markdown || ''], { type: 'text/markdown;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = url
          anchor.download = data.filename || 'dsh-thread.md'
          anchor.click()
          setTimeout(() => URL.revokeObjectURL(url), 2_000)
          showToast(t('exported'))
        } catch (error) {
          showToast(`${t('exportFailed')}: ${error.message}`)
        }
      }, [threadId, showToast, t])

      const openPins = useCallback(async () => {
        setPinsOpen(true)
        setPinsBusy(true)
        try {
          const data = await apiGet('/pins')
          setPinsList(Array.isArray(data.pins) ? data.pins : [])
        } catch (error) {
          showToast(error.message)
        } finally {
          setPinsBusy(false)
        }
      }, [showToast])

      const openPin = useCallback(
        async (pin) => {
          setPinsOpen(false)
          if (pin.threadId !== threadId) {
            await openThread(pin.threadId)
            setTimeout(() => {
              if (!jumpToMessage(pin.id)) showToast(t('searchNotLoaded'))
            }, 420)
            return
          }
          setTimeout(() => {
            if (!jumpToMessage(pin.id)) showToast(t('searchNotLoaded'))
          }, 60)
        },
        [jumpToMessage, openThread, showToast, t, threadId],
      )

      const removePin = useCallback(
        async (pin) => {
          try {
            await apiPost('/message/pin', {
              threadId: pin.threadId,
              messageId: pin.id,
              action: 'remove',
            })
            setPinsList((current) =>
              current.filter((item) => !(item.id === pin.id && item.threadId === pin.threadId)),
            )
            if (pin.threadId === threadId) {
              const data = await apiGet(`/state?thread=${encodeURIComponent(threadId)}`)
              setSnap(data)
            }
          } catch (error) {
            showToast(error.message)
          }
        },
        [threadId, showToast],
      )

      const send = useCallback(
        async (raw, extraFiles, level = difficulty) => {
          const text = String(raw || '').trim()
          const files = Array.isArray(extraFiles) ? extraFiles : attachments
          if ((!text && files.length === 0) || !threadId || sending) return
          const attachmentLines = files
            .map((file) => {
              const label = String(file.name || '附件').replace(/[\[\]]/g, '').trim() || '附件'
              const size = Number(file.bytes) > 0 ? ` · ${formatBytes(Number(file.bytes))}` : ''
              const target = String(file.path || '').replace(/[<>]/g, '').trim()
              return target ? `- [${label}${size}](<${target}>)` : ''
            })
            .filter(Boolean)
          const messageText =
            files.length > 0
              ? `${text || '请查看附件。'}\n\n附件：\n${attachmentLines.join('\n')}`
              : text
          requestNotifications()
          setSending(true)
          setDraft('')
          setPending({ text: text || '请查看附件。', at: Date.now(), difficulty: level })
          stickRef.current = true
          try {
            await apiPost('/send', { threadId, text: messageText, replyTo: quoteTarget?.id || null, difficulty: level })
            setAttachments([])
            setQuoteTarget(null)
            setTimeout(() => {
              apiGet(`/state?thread=${encodeURIComponent(threadId)}`)
                .then((data) => setSnap(data))
                .catch(() => undefined)
            }, 450)
          } catch (error) {
            setPending(null)
            setDraft(text)
            showToast(`${t('sendFailed')}: ${error.message}`)
          } finally {
            setSending(false)
          }
        },
        [attachments, difficulty, requestNotifications, sending, showToast, t, threadId, quoteTarget],
      )

      const stop = useCallback(async () => {
        if (!threadId || stopping) return
        setStopping(true)
        setSnap((previous) =>
          previous
            ? {
                ...previous,
                thread: previous.thread ? { ...previous.thread, running: false } : previous.thread,
                stream: null,
                question: null,
              }
            : previous,
        )
        setPending(null)
        try {
          const data = await apiPost('/stop', { threadId })
          if (data?.thread) setSnap(data)
          showToast(t('stopDone'))
        } catch (error) {
          showToast(error.message)
        } finally {
          setStopping(false)
        }
      }, [showToast, stopping, t, threadId])

      const submitAnswer = useCallback(
        async (answers) => {
          if (!threadId || !snap?.question || answerBusy) return
          setAnswerBusy(true)
          try {
            await apiPost('/answer', {
              threadId,
              questionId: snap.question.id,
              botId: snap.question.botId || null,
              answers,
            })
            setSnap((current) => (current ? { ...current, question: null } : current))
          } catch (error) {
            showToast(error.message)
          } finally {
            setAnswerBusy(false)
          }
        },
        [answerBusy, showToast, snap?.question, threadId],
      )

      const submitApproval = useCallback(
        async (decision) => {
          if (!threadId || !snap?.approval || answerBusy) return
          setAnswerBusy(true)
          try {
            await apiPost('/approval', {
              threadId,
              approvalId: snap.approval.id,
              decision,
            })
            setSnap((current) => (current ? { ...current, approval: null } : current))
          } catch (error) {
            showToast(error.message)
          } finally {
            setAnswerBusy(false)
          }
        },
        [answerBusy, showToast, snap?.approval, threadId],
      )

      const retryAssignment = useCallback(
        async (assignmentId) => {
          if (!assignmentId) return null
          try {
            const data = await apiPost('/assignment/retry', { assignmentId })
            showToast(t('assignmentRetried'))
            if (threadId) {
              const next = await apiGet(`/state?thread=${encodeURIComponent(threadId)}`)
              setSnap(next)
            }
            return data
          } catch (error) {
            showToast(error.message)
            return null
          }
        },
        [threadId, showToast, t],
      )

      const retry = useCallback(() => {
        send(t('retryHint'))
      }, [send, t])

      const toggleVoice = useCallback(() => {
        setVoice((value) => {
          if (value) {
            try {
              window.speechSynthesis?.cancel()
            } catch {
              /* ignore */
            }
          }
          return !value
        })
      }, [])

      const openMemory = useCallback(() => {
        setTab('memory')
        setRightOpen(true)
      }, [])

      const jumpToLatest = useCallback(() => {
        const element = scrollRef.current
        if (element) element.scrollTop = element.scrollHeight
        stickRef.current = true
      }, [])

      if (!booted) return h(LoadingScreen, { t, error: bootError, onRetry: () => setBootNonce((value) => value + 1) })
      if (!snap) return h(LoadingScreen, { t, onRetry: () => setBootNonce((value) => value + 1) })

      const baseItems = snap.items || []
      let items = baseItems
      if (olderItems.length > 0) {
        const seen = new Set()
        items = [...olderItems, ...baseItems]
          .filter((item) => {
            const key = item.id || `${item.kind}:${item.seq}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          .sort(
            (left, right) =>
              (left.time || 0) - (right.time || 0) ||
              String(left.id || '').localeCompare(String(right.id || '')),
          )
      }
      const stream = snap.stream
      const running = Boolean(snap.thread?.running)
      const thread = snap.thread
      const channel = snap.channel || null
      const groupMode = Boolean(channel)
      const pinnedList = Array.isArray(thread?.pinnedMessages)
        ? thread.pinnedMessages
        : thread?.pinnedMessage
          ? [thread.pinnedMessage]
          : []
      const liveQuestion = snap.question
      const liveApproval = snap.approval
      const ghost =
        stream && (stream.text || stream.reasoning)
          ? {
              kind: 'assistant',
              seq: 'stream',
              time: Date.now(),
              text: stream.text || '',
              reasoning: stream.reasoning || '',
              model: thread?.model,
              speaker: stream.speaker || null,
              botId: stream.botId || null,
              streaming: true,
            }
          : null
      const pendingItem = pending
        ? { kind: 'user', seq: 'pending', time: pending.at, text: pending.text, pending: true }
        : null

      const reasoningGroups = new Map()
      let groupKey = 'turn-initial'
      if (!groupMode) {
        for (const item of items) {
          if (item.kind === 'user') groupKey = `turn-${item.seq}`
          if (item.kind === 'assistant' && item.reasoning) {
            const previous = reasoningGroups.get(groupKey) || ''
            reasoningGroups.set(groupKey, previous ? `${previous}\n\n${item.reasoning}` : item.reasoning)
          }
        }
      }
      const activeGroupKey = groupKey
      if (!groupMode && ghost?.reasoning) {
        const previous = reasoningGroups.get(activeGroupKey) || ''
        reasoningGroups.set(activeGroupKey, previous ? `${previous}\n\n${ghost.reasoning}` : ghost.reasoning)
      }

      const content = []
      let run = []
      const renderedReasoning = new Set()
      const itemKey = (item) => `${item.botId || ''}-${item.kind}-${item.seq}`
      const flushRun = () => {
        if (run.length > 0) {
          content.push(h(ActivityRun, { key: `run-${run[0].botId || ''}-${run[0].seq}`, items: run, t }))
          run = []
        }
      }
      const pushReasoning = (key) => {
        if (groupMode) return
        const text = reasoningGroups.get(key)
        if (!text || renderedReasoning.has(key)) return
        renderedReasoning.add(key)
        content.push(
          h(ReasoningBox, {
            key: `reasoning-${key}`,
            reasoning: text,
            t,
            streaming: running && key === activeGroupKey,
          }),
        )
      }
      let activeGroup = 'turn-initial'
      for (const item of items) {
        if (item.kind === 'assignment') {
          flushRun()
          content.push(h(AssignmentCard, { key: itemKey(item), item, t, onRetry: retryAssignment }))
          continue
        }
        if (item.kind === 'activity') {
          run.push(item)
          continue
        }
        flushRun()
        if (item.kind === 'user') {
          activeGroup = `turn-${item.seq}`
          content.push(h(MessageItem, { key: itemKey(item), item, t, voice, onSpeak: (text) => speakText(text, t), onRetry: retry }))
          continue
        }
        if (item.kind === 'assistant') {
          pushReasoning(activeGroup)
          if (!String(item.text || '').trim()) continue
        }
        content.push(
          h(MessageItem, {
            key: itemKey(item),
            item,
            t,
            voice,
            hideReasoning: item.kind === 'assistant',
            onSpeak: (text) => speakText(text, t),
            onRetry: retry,
            onQuote: groupMode ? quoteMessage : undefined,
            onPin: pinChatMessage,
            pinned: pinnedList.some((entry) => entry.id === item.id),
          }),
        )
      }
      flushRun()
      if (ghost) {
        pushReasoning(activeGroup)
        if (String(ghost.text || '').trim()) {
          content.push(
            h(MessageItem, {
              key: 'stream',
              item: ghost,
              t,
              voice,
              hideReasoning: true,
              onSpeak: (text) => speakText(text, t),
              onRetry: retry,
              onQuote: groupMode ? quoteMessage : undefined,
              onPin: pinChatMessage,
            }),
          )
        }
      }
      if (pendingItem) content.push(h(UserMessage, { key: 'pending', item: pendingItem, pending: true, t }))
      if (running && !ghost && !pendingItem) {
        content.push(h(WorkingStrip, { key: 'working', items, t, waiting: Boolean(snap.approval || snap.question) }))
      }

      const empty = items.length === 0 && !ghost && !pending && !running
      const sendMode = running ? 'steer' : 'followup'
      const problemReason =
        !running && thread
          ? thread.error ||
            (thread.checkpoint?.error && !/用户停止|user stop/i.test(thread.checkpoint.error)
              ? thread.checkpoint.error
              : null)
          : null
      const rephrase = () => {
        setDraft(t('problemPrompt'))
        requestAnimationFrame(() => inputRef.current?.focus())
      }
      const copyProblem = async () => {
        const tried = [...items]
          .reverse()
          .filter((item) => item.kind === 'activity')
          .slice(0, 5)
          .map((item) => toolIntent(item, t))
          .filter(Boolean)
        const text = [`${t('problemTitle')}：${problemReason || ''}`, `${t('problemTried')}：${tried.join(' · ')}`, `thread: ${thread?.id || ''}`, `time: ${new Date().toISOString()}`].join('\n')
        const copied = await copyText(text)
        showToast(copied ? t('problemCopyDone') : t('copyFailed'))
      }
      if (!running && problemReason) {
        content.push(
          h(ProblemCard, {
            key: 'problem',
            reason: problemReason,
            items,
            t,
            onRetry: retry,
            onRephrase: rephrase,
            onCopy: copyProblem,
          }),
        )
      }
      const quickActions = [
        {
          id: 'new',
          icon: 'plus',
          label: t('newTask'),
          hint: 'Ctrl N',
          run: () => {
            setSearchOpen(false)
            createTask()
          },
        },
        {
          id: 'specialist',
          icon: 'agents',
          label: t('teamTemplate'),
          hint: '',
          run: () => {
            setSearchOpen(false)
            addSpecialist()
          },
        },
        {
          id: 'memory',
          icon: 'brain',
          label: t('memoryTitle'),
          hint: '',
          run: () => {
            setSearchOpen(false)
            openMemory()
          },
        },
        {
          id: 'guide',
          icon: 'help',
          label: t('guideOpen'),
          hint: '',
          run: () => {
            setSearchOpen(false)
            setGuideStep(0)
            setGuideOpen(true)
          },
        },
        {
          id: 'theme',
          icon: 'sparkles',
          label: t('theme'),
          hint: '',
          run: () => {
            const order = ['dark', 'warm', 'ink', 'aurora', 'ember']
            setTheme(order[(order.indexOf(theme) + 1) % order.length])
            setSearchOpen(false)
          },
        },
      ]
      const updateInfo = snap?.update
      const updateVisible = Boolean(updateInfo?.available && updateInfo.latest && updateInfo.latest !== dismissedUpdate)
      const openUpdate = () => {
        const target = updateInfo?.downloadUrl || updateInfo?.url
        if (target) window.open(target, '_blank', 'noopener,noreferrer')
      }
      const dismissUpdate = () => {
        if (!updateInfo?.latest) return
        try {
          localStorage.setItem('dsh-bot-dismissed-update', updateInfo.latest)
        } catch {
          /* dismissal is optional */
        }
        setDismissedUpdate(updateInfo.latest)
      }

      return h(
        'div',
        { className: `gb-root${railOpen ? ' is-rail-open' : ''}${rightOpen ? ' is-deck-open' : ''}`, 'data-theme': theme },
        h('style', null, CSS),
        h('div', { className: 'gb-stage', 'aria-hidden': true }),
        railOpen
          ? h('div', { className: 'gb-rail-backdrop', onClick: () => setRailOpen(false) })
          : null,
        h(Sidebar, {
          bot: snap.bot,
          bots: snap.bots || [],
          activeBotId: snap.activeBotId || snap.bot?.id,
          onSelectBot: selectBot,
          onNewBot: () => openBotEditor({ id: null, name: '', emoji: '◉' }),
          onEditBot: (bot) =>
            openBotEditor((snap.bots || []).find((item) => item.id === bot?.id) || bot),
          onNewGroup: () => openGroupEditor(null),
          onTeam: addSpecialist,
          onPin: pinThread,
          onReorder: reorderThreads,
          roster: snap.roster || [],
          threads: snap.threads || [],
          activeId: thread.id,
          onSelect: openThread,
          onNew: createTask,
          onDelete: deleteTask,
          onMemory: openMemory,
          onGuide: () => {
            setGuideStep(0)
            setGuideOpen(true)
          },
          onClose: () => setRailOpen(false),
          t,
          open: railOpen,
        }),
        h(
          'main',
          { className: 'gb-main' },
          h(TopBar, {
            thread,
            model: thread?.model || snap.bot?.modelLabel,
            running,
            channel,
            onManage: channel && !channel.meeting ? () => openGroupEditor(channel) : null,
            onRename: renameThread,
            onSearch: () => setSearchOpen(true),
            onExport: exportThread,
            onPins: openPins,
            onReplay: (snap.items || []).some((item) => (item.kind === 'user' || item.kind === 'assistant') && String(item.text || '').trim())
              ? () => setReplayOpen(true)
              : null,
            theme,
            onTheme: setTheme,
            archived: thread?.archived === true,
            onArchive: channel?.meeting ? null : archiveThread,
            t,
          }),
          updateVisible
            ? h(
                'div',
                { className: 'gb-update-banner' },
                h(Icon, { name: 'arrowDown', size: 14 }),
                h(
                  'div',
                  { className: 'gb-update-text' },
                  h('strong', null, t('updateAvailable', { version: updateInfo.latest })),
                  h('span', null, t('updateHint')),
                ),
                h('button', { type: 'button', className: 'gb-small-btn', onClick: openUpdate }, t('updateDownload')),
                h('button', { type: 'button', className: 'gb-icon-btn', onClick: dismissUpdate, 'aria-label': t('updateLater') }, h(Icon, { name: 'close', size: 13 })),
              )
            : null,
          stalled && running
            ? h(
                'div',
                { className: 'gb-stall-banner' },
                h(Icon, { name: 'alert', size: 14 }),
                h('span', null, t('stalledHint')),
                h('button', { type: 'button', className: 'gb-small-btn', onClick: () => { progressRef.current = { at: Date.now(), key: progressRef.current.key }; setStalled(false) } }, t('stalledWait')),
                h('button', { type: 'button', className: 'gb-small-btn', onClick: stop }, t('stop')),
              )
            : null,
          offline
            ? h(
                'div',
                { className: 'gb-offline' },
                h(Icon, { name: 'alert', size: 14 }),
                h('span', null, t('offlineBanner')),
                h('span', { className: 'gb-offline-sub' }, t('offlineHint')),
              )
            : null,
          snap.modelReady === false
            ? h(
                'div',
                { className: 'gb-model-warning' },
                h(Icon, { name: 'alert', size: 14 }),
                h(
                  'div',
                  { className: 'gb-model-warning-text' },
                  h('strong', null, t('modelMissing')),
                  h('span', null, t('modelMissingHint')),
                ),
                h(
                  'button',
                  { type: 'button', className: 'gb-small-btn', onClick: retryModel },
                  t('modelRetry'),
                ),
              )
            : null,
          pinnedList.length > 0
            ? h(
                'div',
                { className: 'gb-pinned-wrap' },
                h(
                  'div',
                  { className: 'gb-pinned' },
                  h(Icon, { name: 'pin', size: 12 }),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'gb-pinned-body',
                      onClick: () => jumpToMessage(pinnedList[0].id),
                      title: t('pinnedMessage'),
                    },
                    h(
                      'span',
                      { className: 'gb-pinned-label' },
                      pinnedList[0].name ? `@${pinnedList[0].name}` : t('pinnedMessage'),
                    ),
                    h('span', { className: 'gb-pinned-text' }, truncateText(pinnedList[0].text, 180)),
                  ),
                  pinnedList.length > 1
                    ? h(
                        'button',
                        {
                          type: 'button',
                          className: 'gb-pinned-count',
                          onClick: () => setPinnedOpen((value) => !value),
                          title: t('pinnedList'),
                        },
                        `+${pinnedList.length - 1}`,
                      )
                    : null,
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'gb-pinned-clear',
                      onClick: () => pinChatMessage(null),
                      title: t('pinnedClearAll'),
                      'aria-label': t('pinnedClearAll'),
                    },
                    '×',
                  ),
                ),
                pinnedOpen && pinnedList.length > 1
                  ? h(
                      'div',
                      { className: 'gb-pinned-list' },
                      pinnedList.map((entry) =>
                        h(
                          'div',
                          { key: entry.id, className: 'gb-pinned-item' },
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'gb-pinned-item-main',
                              onClick: () => {
                                setPinnedOpen(false)
                                jumpToMessage(entry.id)
                              },
                            },
                            h(
                              'span',
                              { className: 'gb-pinned-item-name' },
                              entry.name ? `@${entry.name}` : t('pinnedMessage'),
                            ),
                            h('span', { className: 'gb-pinned-item-text' }, truncateText(entry.text, 120)),
                          ),
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'gb-pinned-clear',
                              onClick: () => pinChatMessage({ id: entry.id }),
                              title: t('unpinMessage'),
                              'aria-label': t('unpinMessage'),
                            },
                            '×',
                          ),
                        ),
                      ),
                    )
                  : null,
              )
            : null,
          h(
            'div',
            { className: 'gb-chat-scroll', ref: scrollRef },
            h(
              'div',
              { className: `gb-chat-inner${empty ? ' is-empty' : ''}` },
              channel && (historyHasMore || olderItems.length > 0)
                ? h(
                    'div',
                    { className: 'gb-history-load' },
                    historyHasMore
                      ? h(
                          'button',
                          {
                            type: 'button',
                            className: 'gb-small-btn',
                            disabled: historyBusy,
                            onClick: loadEarlier,
                          },
                          historyBusy ? h(Spinner, { size: 11 }) : h(Icon, { name: 'arrowUp', size: 12 }),
                          t('loadEarlier'),
                        )
                      : h('span', { className: 'gb-history-end' }, t('noMoreHistory')),
                  )
                : null,
              empty ? h(Welcome, { t, onSend: send, onCreateTeam: addSpecialist, showTeamCta: (snap.bots || []).length <= 1 }) : content,
              !empty && running ? h('div', { className: 'gb-chat-spacer' }) : null,
            ),
          ),
          !stickRef.current
            ? h(
                'button',
                { type: 'button', className: 'gb-jump', onClick: jumpToLatest },
                h(Icon, { name: 'arrowDown', size: 14 }),
                t('scrollBottom'),
              )
            : null,
          !running && snap.checkpoint
            ? h(CheckpointCard, { checkpoint: snap.checkpoint, t, onResume: resumeCheckpoint, busy: resuming })
            : null,
          h(PendingPrompt, {
            question: liveQuestion,
            approval: liveApproval,
            t,
            onAnswer: submitAnswer,
            onApproval: submitApproval,
            onStop: stop,
            onNative: () => {
              try {
                ctx.layout.selectPanel(null)
              } catch {
                showToast(t('approvalNativeManual'))
              }
            },
            submitting: answerBusy,
          }),
          channel
            ? h(
                'div',
                { className: 'gb-mention-row' },
                h('span', { className: 'gb-mention-label' }, t('atMember')),
                (channel.members || []).map((member) =>
                  h(
                    'button',
                    {
                      key: member.id,
                      type: 'button',
                      className: `gb-mention${member.running ? ' is-running' : ''}`,
                      onClick: () => insertMention(member.name),
                    },
                    h('i', null, member.emoji || '◉'),
                    member.name,
                  ),
                ),
                h(
                  'button',
                  { type: 'button', className: 'gb-mention is-all', onClick: () => insertMention(t('groupMentionAll')) },
                  `@${t('groupMentionAll')}`,
                ),
                h('span', { className: 'gb-mention-hint' }, t('groupHint')),
              )
            : null,
          h(Composer, {
            value: draft,
            onChange: setDraft,
            onSend: send,
            onStop: stop,
            running,
            stopping,
            admin: snap.bot?.privilege === 'admin',
            theme,
            t,
            inputRef,
            difficulty,
            onDifficulty: setDifficulty,
            paths: snap?.paths,
            sendMode,
            attachments,
            onUpload: uploadFiles,
            onRemoveAttachment: removeAttachment,
            uploading,
            onDictate: toggleDictation,
            dictating,
            dictationAvailable,
            members: channel?.members || [],
            quote: quoteTarget,
            onClearQuote: () => setQuoteTarget(null),
            onToggleComputer: () => {
              setRightOpen((value) => {
                const next = !value
                if (next && window.innerWidth <= 1500) setRailOpen(false)
                return next
              })
            },
            onToggleRail: () => {
              if (!railOpen && rightOpen) setRightOpen(false)
              setRailOpen((value) => !value)
            },
            onToggleVoice: toggleVoice,
            onReplay: (snap.items || []).some((item) => (item.kind === 'user' || item.kind === 'assistant') && String(item.text || '').trim())
              ? () => setReplayOpen(true)
              : null,
            onReset: resetTask,
          }),
        ),
        rightOpen
          ? h(ComputerPanel, {
              snap,
              t,
              tab,
              setTab,
              botId: snap.bot?.id,
              onOpenThread: openThread,
              onRefresh: refreshSnapshot,
              onClose: () => setRightOpen(false),
              onToast: showToast,
              onReset: resetTask,
              onRunSkill: runSkill,
              onDeleteSkill: deleteSkill,
              onCaptureSkill: captureSkill,
              skillBusy,
              captureBusy,
              onUndo: undoSnapshot,
              onCreateTeam: addSpecialist,
              theme,
            })
          : null,
        botEditor
          ? h(BotEditor, {
              bot: botEditor,
              catalog,
              onClose: () => setBotEditor(null),
              onSave: saveBot,
              onDelete: deleteBot,
              t,
            })
          : null,
        groupEditor
          ? h(GroupEditor, {
              group: groupEditor,
              bots: snap.bots || [],
              onClose: () => setGroupEditor(null),
              onSave: saveGroup,
              onDelete: deleteGroup,
              t,
            })
          : null,
        replayOpen
          ? h(ReplayModal, { items: snap.items, t, onClose: () => setReplayOpen(false) })
          : null,
        guideOpen
          ? h(GuideModal, {
              step: guideStep,
              onStep: setGuideStep,
              onClose: closeGuide,
              onCreate: () => {
                closeGuide()
                createTask()
              },
              onAdd: () => {
                closeGuide()
                addSpecialist()
              },
              t,
            })
          : null,
        searchOpen
          ? h(
              'div',
              { className: 'gb-search-overlay', onClick: () => setSearchOpen(false) },
              h(
                'div',
                { className: 'gb-search-panel', onClick: (event) => event.stopPropagation() },
                h(
                  'div',
                  { className: 'gb-search-head' },
                  h(Icon, { name: 'search', size: 14 }),
                  h('input', {
                    autoFocus: true,
                    value: searchQuery,
                    placeholder: t('searchPlaceholder'),
                    onChange: (event) => setSearchQuery(event.target.value),
                    onKeyDown: (event) => {
                      if (event.key === 'Escape') setSearchOpen(false)
                    },
                  }),
                  h(
                    'div',
                    { className: 'gb-search-scope' },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: `gb-search-scope-btn${searchScope === 'thread' ? ' is-active' : ''}`,
                        onClick: () => setSearchScope('thread'),
                      },
                      t('searchScopeThread'),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: `gb-search-scope-btn${searchScope === 'all' ? ' is-active' : ''}`,
                        onClick: () => setSearchScope('all'),
                      },
                      t('searchScopeAll'),
                    ),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'gb-search-close',
                      onClick: () => setSearchOpen(false),
                      'aria-label': t('close'),
                    },
                    '×',
                  ),
                ),
                h(
                  'div',
                  { className: 'gb-search-results' },
                  searchBusy
                    ? h('div', { className: 'gb-search-empty' }, h(Spinner, { size: 14 }))
                    : !searchQuery.trim()
                      ? h(
                          'div',
                          { className: 'gb-command-list' },
                          h(
                            'div',
                            { className: 'gb-command-head' },
                            h(Icon, { name: 'sparkles', size: 12 }),
                            h('span', null, t('commandTitle')),
                            h('kbd', null, 'Ctrl K'),
                          ),
                          quickActions.map((action) =>
                            h(
                              'button',
                              {
                                key: action.id,
                                type: 'button',
                                className: 'gb-command-item',
                                onClick: action.run,
                              },
                              h(Icon, { name: action.icon, size: 14 }),
                              h('span', null, action.label),
                              action.hint ? h('kbd', null, action.hint) : null,
                            ),
                          ),
                          h('p', { className: 'gb-search-hint' }, t('searchHint')),
                        )
                      : searchResults.length === 0
                        ? h(
                            'p',
                            { className: 'gb-search-empty' },
                            t('searchEmpty'),
                          )
                        : searchResults.map((item) => {
                            const isMemory = item.kind === 'memory'
                            const isThread = item.kind === 'thread'
                            const meta = isMemory
                              ? `${item.botName || ''} · ${t('memory')}`
                              : isThread
                                ? `${t('tasks')} · ${item.threadTitle || item.title || ''}`
                                : `${searchScope === 'all' ? `${item.threadTitle || ''} · ` : ''}${item.kind === 'user' ? t('replyYou') : item.speaker?.name || ''} · ${formatClock(item.time)}`
                            const text = isMemory
                              ? item.snippet
                              : isThread
                                ? item.title
                                : snippetAround(item.text, searchQuery)
                            return h(
                              'button',
                              {
                                key: `${item.kind || 'message'}:${item.threadId || item.botId || 'current'}:${item.id}`,
                                type: 'button',
                                className: `gb-search-item is-${item.kind || 'message'}`,
                                onClick: () => openSearchResult(item),
                              },
                              h('span', { className: 'gb-search-meta' }, meta),
                              h(
                                'span',
                                { className: 'gb-search-text' },
                                highlightText(text, searchQuery),
                              ),
                            )
                          }),
                ),
              ),
            )
          : null,
        pinsOpen
          ? h(
              'div',
              { className: 'gb-search-overlay', onClick: () => setPinsOpen(false) },
              h(
                'div',
                { className: 'gb-search-panel', onClick: (event) => event.stopPropagation() },
                h(
                  'div',
                  { className: 'gb-search-head' },
                  h(Icon, { name: 'pin', size: 14 }),
                  h('span', { className: 'gb-pins-title' }, t('pinsTitle')),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'gb-search-close',
                      onClick: () => setPinsOpen(false),
                      'aria-label': t('close'),
                    },
                    '×',
                  ),
                ),
                h(
                  'div',
                  { className: 'gb-search-results' },
                  pinsBusy
                    ? h('div', { className: 'gb-search-empty' }, h(Spinner, { size: 14 }))
                    : pinsList.length === 0
                      ? h('p', { className: 'gb-search-empty' }, t('pinsEmpty'))
                      : pinsList.map((pin) =>
                          h(
                            'div',
                            { key: `${pin.threadId}:${pin.id}`, className: 'gb-pin-row' },
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'gb-search-item',
                                onClick: () => openPin(pin),
                              },
                              h(
                                'span',
                                { className: 'gb-search-meta' },
                                `${pin.threadTitle} · ${pin.name || t('replyYou')} · ${formatClock(pin.at)}`,
                              ),
                              h('span', { className: 'gb-search-text' }, truncateText(pin.text, 180)),
                            ),
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'gb-search-close',
                                onClick: () => removePin(pin),
                                title: t('pinsRemove'),
                                'aria-label': t('pinsRemove'),
                              },
                              '×',
                            ),
                          ),
                        ),
                ),
              ),
            )
          : null,
        toast ? h(Toast, { message: toast, onClose: () => setToast(null), t }) : null,
      )
    }

    function BotIcon({ size = 18, active = false }) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          'aria-hidden': true,
          focusable: false,
          style: { display: 'block', opacity: active ? 1 : 0.82 },
        },
        h('circle', { cx: 12, cy: 12, r: 8.6, stroke: 'currentColor', strokeWidth: 1.35, opacity: 0.7 }),
        h('circle', { cx: 12, cy: 12, r: 5.2, fill: 'currentColor', opacity: 0.18 }),
        h('ellipse', { cx: 12, cy: 12, rx: 3.4, ry: 1.4, fill: 'currentColor' }),
        h('circle', { cx: 12, cy: 12, r: 0.9, fill: 'currentColor' }),
        h('path', { d: 'M18.7 18.7h3.4M20.4 17v3.4', stroke: 'currentColor', strokeWidth: 1.1, strokeLinecap: 'round', opacity: 0.8 }),
      )
    }

    const CSS = `
.gb-root {
  --gb-bg: #080908;
  --gb-panel: #101110;
  --gb-panel-2: #171817;
  --gb-overlay: #1d1e1b;
  --gb-line: #292b26;
  --gb-line-strong: #3a3d34;
  --gb-text: #f1f2ed;
  --gb-muted: #9a9d94;
  --gb-faint: #6f7368;
  --gb-accent: #c8ff5a;
  --gb-signal: #c8ff5a;
  --gb-error: #ff716c;
  --gb-warn: #f2c14e;
  --gb-success: #8ee08a;
  --gb-radius: 16px;
  position: relative;
  z-index: 5;
  display: flex;
  width: 100%;
  height: 100dvh;
  max-height: 100dvh;
  min-height: 480px;
  overflow: hidden;
  color: var(--gb-text);
  background:
    radial-gradient(920px 520px at 76% -12%, color-mix(in srgb, var(--gb-signal) 8%, transparent), transparent 68%),
    radial-gradient(680px 480px at 12% 112%, color-mix(in srgb, var(--gb-accent) 5%, transparent), transparent 70%),
    var(--gb-bg);
  background-color: #080908 !important;
  isolation: isolate;
  font-family: "Segoe UI Variable Text", "Segoe UI", "PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

:root[data-dsh-bot-theme="warm"] {
  --gb-bg: #f4ead8;
  --gb-panel: #fff8ec;
  --gb-panel-2: #efe0c8;
  --gb-overlay: #fffaf0;
  --gb-line: #e0cdb0;
  --gb-line-strong: #c6a87f;
  --gb-text: #2f2418;
  --gb-muted: #7a6954;
  --gb-faint: #a08c73;
  --gb-accent: #d9772f;
  --gb-signal: #c26422;
  --gb-error: #b83a2f;
  --gb-warn: #a86b1f;
  --gb-success: #4c7a4a;
  color-scheme: light;
}
:root[data-dsh-bot-theme="ink"] {
  --gb-bg: #f0eee7;
  --gb-panel: #fbfaf6;
  --gb-panel-2: #e7e3d9;
  --gb-overlay: #fdfcf8;
  --gb-line: #d3cec1;
  --gb-line-strong: #b7b0a0;
  --gb-text: #1d1c19;
  --gb-muted: #6f6b62;
  --gb-faint: #999388;
  --gb-accent: #a33b2e;
  --gb-signal: #9e3a2d;
  --gb-error: #a83228;
  --gb-warn: #8a6a2a;
  --gb-success: #456b4a;
  color-scheme: light;
}
:root[data-dsh-bot-theme="aurora"] {
  --gb-bg: #0d1415;
  --gb-panel: #131d1e;
  --gb-panel-2: #1a2728;
  --gb-overlay: #223234;
  --gb-line: #2a3a3c;
  --gb-line-strong: #3f5557;
  --gb-text: #e7efec;
  --gb-muted: #a3b5af;
  --gb-faint: #6f837d;
  --gb-accent: #9ccfd8;
  --gb-signal: #8fbcbb;
  --gb-error: #e78284;
  --gb-warn: #ebcb8b;
  --gb-success: #a3be8c;
  color-scheme: dark;
}
:root[data-dsh-bot-theme="ember"] {
  --gb-bg: #191613;
  --gb-panel: #211d19;
  --gb-panel-2: #2b2520;
  --gb-overlay: #352d26;
  --gb-line: #40362d;
  --gb-line-strong: #5a4b3e;
  --gb-text: #f4ede4;
  --gb-muted: #b9a99a;
  --gb-faint: #88786a;
  --gb-accent: #e0a370;
  --gb-signal: #d98b5f;
  --gb-error: #e07a7a;
  --gb-warn: #e6c27a;
  --gb-success: #9fb48a;
  color-scheme: dark;
}
:root[data-dsh-bot-theme="warm"] .gb-deck,
:root[data-dsh-bot-theme="warm"] .gb-rail { background: #fff8ec !important; }
:root[data-dsh-bot-theme="ink"] .gb-deck,
:root[data-dsh-bot-theme="ink"] .gb-rail { background: #fbfaf6 !important; }
:root[data-dsh-bot-theme="aurora"] .gb-deck,
:root[data-dsh-bot-theme="aurora"] .gb-rail { background: #0d1422 !important; }
:root[data-dsh-bot-theme="ember"] .gb-deck,
:root[data-dsh-bot-theme="ember"] .gb-rail { background: #1b1310 !important; }
:root[data-dsh-bot-theme="warm"] .gb-main {
  background:
    radial-gradient(900px 500px at 82% -8%, color-mix(in srgb, #d9772f 8%, transparent), transparent 66%),
    repeating-linear-gradient(0deg, rgba(120, 85, 45, .025) 0 1px, transparent 1px 4px),
    var(--gb-bg) !important;
}
:root[data-dsh-bot-theme="ink"] .gb-main {
  background:
    radial-gradient(1100px 620px at 78% -12%, rgba(30, 28, 24, .07), transparent 62%),
    radial-gradient(700px 500px at 8% 110%, rgba(30, 28, 24, .05), transparent 66%),
    repeating-linear-gradient(90deg, rgba(40, 38, 32, .018) 0 1px, transparent 1px 5px),
    var(--gb-bg) !important;
}
:root[data-dsh-bot-theme="aurora"] .gb-main {
  background:
    radial-gradient(900px 560px at 80% -10%, rgba(156, 207, 216, .07), transparent 64%),
    radial-gradient(700px 500px at 8% 112%, rgba(143, 188, 187, .04), transparent 70%),
    var(--gb-bg) !important;
}
:root[data-dsh-bot-theme="ember"] .gb-main {
  background:
    radial-gradient(900px 540px at 82% -8%, rgba(224, 163, 112, .07), transparent 64%),
    radial-gradient(700px 500px at 6% 112%, rgba(217, 139, 95, .035), transparent 70%),
    var(--gb-bg) !important;
}
:root[data-dsh-bot-theme="warm"] .gb-user-bubble {
  color: #2f2418;
  border-color: #d9b68a;
  border-radius: 18px 18px 4px 18px;
  background: #f0d9bb;
}
:root[data-dsh-bot-theme="warm"] .gb-assistant-body {
  padding: 11px 13px;
  border: 1px solid #e4d2b8;
  border-radius: 4px 14px 14px 14px;
  background: color-mix(in srgb, #fffaf1 86%, transparent);
}
:root[data-dsh-bot-theme="warm"] .gb-run,
:root[data-dsh-bot-theme="warm"] .gb-problem { background: #fff8ec; }
:root[data-dsh-bot-theme="ink"] .gb-user-bubble {
  color: #1d1c19;
  border: 1px solid #2b2925;
  border-radius: 2px;
  background: #fbfaf6;
  box-shadow: 3px 3px 0 rgba(35, 33, 28, .13);
}
:root[data-dsh-bot-theme="ink"] .gb-assistant-body {
  padding-left: 14px;
  border-left: 2px solid #2b2925;
  border-radius: 0;
}
:root[data-dsh-bot-theme="ink"] .gb-assistant-head,
:root[data-dsh-bot-theme="ink"] .gb-topbar-name,
:root[data-dsh-bot-theme="ink"] .gb-deck-name,
:root[data-dsh-bot-theme="ink"] .gb-hero-title {
  font-family: "KaiTi", "STKaiti", "SimSun", "Songti SC", serif;
  letter-spacing: .03em;
}
:root[data-dsh-bot-theme="ink"] .gb-run,
:root[data-dsh-bot-theme="ink"] .gb-problem,
:root[data-dsh-bot-theme="ink"] .gb-notice {
  border-color: #bdb6a6;
  border-radius: 2px;
  background: color-mix(in srgb, #fbfaf6 76%, transparent);
  box-shadow: 2px 2px 0 rgba(35, 33, 28, .07);
}
:root[data-dsh-bot-theme="ink"] .gb-composer {
  border: 1px solid #2b2925 !important;
  border-radius: 3px !important;
  box-shadow: 4px 4px 0 rgba(35, 33, 28, .12) !important;
}
:root[data-dsh-bot-theme="warm"] .gb-composer-wrap { background: linear-gradient(to top, #f4ead8 58%, transparent) !important; }
:root[data-dsh-bot-theme="ink"] .gb-composer-wrap { background: linear-gradient(to top, #f0eee7 58%, transparent) !important; }
:root[data-dsh-bot-theme="warm"] .gb-main,
:root[data-dsh-bot-theme="ink"] .gb-main,
:root[data-dsh-bot-theme="warm"] .gb-topbar,
:root[data-dsh-bot-theme="ink"] .gb-topbar { background: var(--gb-bg) !important; }
:root[data-dsh-bot-theme="warm"] .gb-root,
:root[data-dsh-bot-theme="ink"] .gb-root {
  --gb-bg: inherit;
  --gb-panel: inherit;
  --gb-panel-2: inherit;
  --gb-overlay: inherit;
  --gb-line: inherit;
  --gb-line-strong: inherit;
  --gb-text: inherit;
  --gb-muted: inherit;
  --gb-faint: inherit;
  --gb-accent: inherit;
  --gb-signal: inherit;
  --gb-error: inherit;
  --gb-warn: inherit;
  --gb-success: inherit;
  background-color: var(--gb-bg) !important;
}
.gb-root[data-theme="aurora"] {
  --gb-bg: #0d1415;
  --gb-panel: #131d1e;
  --gb-panel-2: #1a2728;
  --gb-overlay: #223234;
  --gb-line: #2a3a3c;
  --gb-line-strong: #3f5557;
  --gb-text: #e7efec;
  --gb-muted: #a3b5af;
  --gb-faint: #6f837d;
  --gb-accent: #9ccfd8;
  --gb-signal: #8fbcbb;
  --gb-error: #e78284;
  --gb-warn: #ebcb8b;
  --gb-success: #a3be8c;
  color-scheme: dark;
}
.gb-root[data-theme="ember"] {
  --gb-bg: #191613;
  --gb-panel: #211d19;
  --gb-panel-2: #2b2520;
  --gb-overlay: #352d26;
  --gb-line: #40362d;
  --gb-line-strong: #5a4b3e;
  --gb-text: #f4ede4;
  --gb-muted: #b9a99a;
  --gb-faint: #88786a;
  --gb-accent: #e0a370;
  --gb-signal: #d98b5f;
  --gb-error: #e07a7a;
  --gb-warn: #e6c27a;
  --gb-success: #9fb48a;
  color-scheme: dark;
}
.gb-root[data-theme="warm"] .gb-stage,
.gb-root[data-theme="ink"] .gb-stage,
.gb-root[data-theme="warm"] .gb-main,
.gb-root[data-theme="ink"] .gb-main,
.gb-root[data-theme="warm"] .gb-topbar,
.gb-root[data-theme="ink"] .gb-topbar { background: var(--gb-bg) !important; }
.gb-root[data-theme="warm"] .gb-rail,
.gb-root[data-theme="ink"] .gb-rail,
.gb-root[data-theme="warm"] .gb-deck,
.gb-root[data-theme="ink"] .gb-deck { background: var(--gb-panel) !important; }
.gb-root[data-theme="warm"] .gb-composer,
.gb-root[data-theme="ink"] .gb-composer { background: var(--gb-panel) !important; }
.gb-root[data-theme="warm"] .gb-modal,
.gb-root[data-theme="ink"] .gb-modal { background: var(--gb-panel); }
.gb-root[data-theme="warm"] .gb-pending,
.gb-root[data-theme="ink"] .gb-pending { background: var(--gb-panel-2); }
.gb-root[data-theme="warm"] .gb-screen,
.gb-root[data-theme="ink"] .gb-screen { background: var(--gb-panel-2); }
:root[data-dsh-bot-theme="warm"] .gb-modal { background: #fff8ec; }
:root[data-dsh-bot-theme="ink"] .gb-modal { background: #fbfaf6; }
:root[data-dsh-bot-theme="warm"] .gb-toast { background: #fff8ec; color: #2f2418; }
:root[data-dsh-bot-theme="ink"] .gb-toast { background: #fbfaf6; color: #1d1c19; }
.gb-theme-picker { position: relative; }
.gb-theme-trigger { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 8px; border: 1px solid var(--gb-line); border-radius: 999px; background: color-mix(in srgb, var(--gb-panel-2) 55%, transparent); color: var(--gb-muted); font-size: 8px; }
.gb-theme-trigger:hover { color: var(--gb-text); border-color: var(--gb-line-strong); }
.gb-theme-trigger > svg { opacity: .65; }
.gb-theme-swatch { width: 13px; height: 13px; flex: none; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--gb-line-strong) 70%, transparent); }
.gb-theme-swatch.is-dark { background: #101110; }
.gb-theme-swatch.is-warm { background: linear-gradient(135deg, #fff3df 0 48%, #c26422 48% 100%); }
.gb-theme-swatch.is-ink { background: linear-gradient(135deg, #f7f4ec 0 48%, #33312b 48% 100%); }
.gb-theme-swatch.is-aurora { background: linear-gradient(135deg, #131d1e 0 48%, #9ccfd8 48% 100%); }
.gb-theme-swatch.is-ember { background: linear-gradient(135deg, #211d19 0 48%, #e0a370 48% 100%); }
.gb-theme-pop { position: absolute; right: 0; top: calc(100% + 8px); z-index: 60; width: 250px; padding: 6px; border: 1px solid var(--gb-line-strong); border-radius: 12px; background: var(--gb-overlay); box-shadow: 0 20px 55px rgba(0,0,0,.4); }
.gb-theme-pop-head { padding: 5px 7px 7px; color: var(--gb-faint); font-size: 7.5px; letter-spacing: .12em; text-transform: uppercase; }
.gb-theme-option { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--gb-text); text-align: left; }
.gb-theme-option:hover { background: color-mix(in srgb, var(--gb-panel-2) 70%, transparent); }
.gb-theme-option.is-active { border-color: color-mix(in srgb, var(--gb-signal) 40%, var(--gb-line)); background: color-mix(in srgb, var(--gb-signal) 7%, transparent); }
.gb-theme-option .gb-theme-swatch { width: 24px; height: 24px; border-radius: 8px; }
.gb-theme-option-text { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 2px; }
.gb-theme-option-text strong { font-size: 10px; font-weight: 600; }
.gb-theme-option-text small { color: var(--gb-faint); font-size: 8px; }
.gb-theme-option > svg { flex: none; color: var(--gb-signal); }

.gb-root *, .gb-root *::before, .gb-root *::after { box-sizing: border-box; }
.gb-root, .gb-root * { -webkit-app-region: no-drag; }
/* The shipped cinematic theme paints a body-level HUD canvas above ordinary
   panels. Keep its texture but stop it from competing with the bot page. */
body:has(.gb-root) #hax-hud { opacity: .18 !important; }
body:has(.gb-root) #hax-idle { opacity: 0 !important; }
body:has(.gb-root) #hax-log { opacity: .18 !important; }
.gb-stage { position: absolute; inset: 0; z-index: 0; background: #080908; pointer-events: none; }
.gb-rail, .gb-main, .gb-deck { z-index: 1; }
.gb-root ::selection { background: color-mix(in srgb, var(--gb-signal) 35%, transparent); color: var(--gb-text); }
.gb-root button, .gb-root textarea { font: inherit; color: inherit; }
.gb-root button { cursor: pointer; }
.gb-root button:disabled { cursor: default; }
.gb-root :focus-visible { outline: 2px solid color-mix(in srgb, var(--gb-signal) 70%, transparent); outline-offset: 2px; }
.gb-mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, ui-monospace, monospace; font-size: 11px; letter-spacing: .02em; }
.gb-muted { color: var(--gb-muted); }
.gb-sep { color: var(--gb-faint); }

/* orb */
.gb-orb { position: relative; display: inline-block; width: var(--gb-orb-size, 48px); height: var(--gb-orb-size, 48px); flex: none; }
.gb-orb-halo { position: absolute; inset: -34%; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--gb-signal) 22%, transparent), transparent 66%); filter: blur(7px); animation: gb-breathe 5.4s ease-in-out infinite; }
.gb-orb-sphere { position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle at 34% 27%, #fffdf4 0%, #d8dbcf 34%, #777c6b 68%, #14160f 100%); box-shadow: inset -5px -7px 14px rgba(0,0,0,.55), inset 2px 3px 8px rgba(255,255,255,.35), 0 0 28px color-mix(in srgb, var(--gb-signal) 12%, transparent); }
.gb-orb-slit { position: absolute; left: 23%; right: 23%; top: 47%; height: 15%; border-radius: 50%; background: #090b06; transform: rotate(-9deg); box-shadow: 0 0 0 1px color-mix(in srgb, var(--gb-signal) 22%, transparent) inset, 0 0 12px rgba(0,0,0,.8); }
.gb-orb.is-working .gb-orb-slit { background: var(--gb-signal); box-shadow: 0 0 18px color-mix(in srgb, var(--gb-signal) 80%, transparent), 0 0 0 1px #fff6 inset; animation: gb-slit 2.2s ease-in-out infinite; }
.gb-orb.is-working .gb-orb-halo { animation-duration: 2.4s; opacity: 1; }

@keyframes gb-breathe { 0%,100% { transform: scale(.94); opacity: .55 } 50% { transform: scale(1.08); opacity: 1 } }
@keyframes gb-slit { 0%,100% { transform: rotate(-9deg) scaleX(1) } 50% { transform: rotate(-9deg) scaleX(.82) } }
@keyframes gb-spin { to { transform: rotate(360deg) } }
@keyframes gb-blink { 0%,100% { opacity: .2 } 50% { opacity: 1 } }
@keyframes gb-shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
@keyframes gb-fade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
@keyframes gb-slide { from { opacity: 0; transform: translateX(14px) } to { opacity: 1; transform: none } }

/* rail */
.gb-rail { position: relative; z-index: 20; display: flex; flex-direction: column; flex: none; width: 238px; padding: 18px 12px 14px; border-right: 1px solid var(--gb-line); background: #0a0b09 !important; }
.gb-brand { display: flex; align-items: center; gap: 10px; padding: 2px 6px 16px; }
.gb-brand-text { min-width: 0; }
.gb-brand-name { font-size: 13px; font-weight: 700; letter-spacing: .14em; line-height: 1.1; }
.gb-brand-tag { margin-top: 3px; font-size: 8px; letter-spacing: .16em; color: var(--gb-faint); white-space: nowrap; }
.gb-presence { display: flex; align-items: center; gap: 6px; margin: 0 6px 14px; padding: 7px 9px; border: 1px solid var(--gb-line); border-radius: 9px; font-size: 10.5px; color: var(--gb-muted); background: color-mix(in srgb, var(--gb-panel-2) 40%, transparent); }
.gb-presence-sep { color: var(--gb-faint); }
.gb-presence-model { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gb-status-dot { width: 7px; height: 7px; flex: none; border-radius: 50%; background: var(--gb-faint); }
.gb-status-dot.is-running { background: var(--gb-signal); box-shadow: 0 0 0 3px color-mix(in srgb, var(--gb-signal) 14%, transparent), 0 0 12px color-mix(in srgb, var(--gb-signal) 65%, transparent); animation: gb-blink 2.4s ease-in-out infinite; }
.gb-signal { width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--gb-signal); box-shadow: 0 0 8px color-mix(in srgb, var(--gb-signal) 70%, transparent); }
.gb-new-btn { display: flex; align-items: center; gap: 8px; width: 100%; height: 38px; padding: 0 12px; border: 0; border-radius: 10px; background: var(--gb-text) !important; color: var(--gb-bg) !important; font-size: 12.5px; font-weight: 650; transition: transform .18s ease, background .18s ease; }
.gb-new-btn:hover { transform: translateY(-1px); background: color-mix(in srgb, var(--gb-text) 92%, var(--gb-signal)); }
.gb-new-kbd { margin-left: auto; font-family: "Cascadia Code", Consolas, monospace; font-size: 9px; font-weight: 500; opacity: .5; }
.gb-section-label { display: flex; align-items: center; justify-content: space-between; margin: 20px 8px 8px; font-size: 9px; letter-spacing: .16em; color: var(--gb-faint); }
.gb-section-count { font-family: "Cascadia Code", Consolas, monospace; letter-spacing: 0; }
.gb-thread-list { display: flex; flex-direction: column; gap: 2px; overflow-y: auto; min-height: 0; scrollbar-width: thin; }
.gb-thread { position: relative; display: flex; align-items: center; border-radius: 9px; color: var(--gb-muted); }
.gb-thread:hover { background: color-mix(in srgb, var(--gb-panel-2) 55%, transparent); color: var(--gb-text); }
.gb-thread.is-active { background: color-mix(in srgb, var(--gb-panel-2) 78%, transparent); color: var(--gb-text); box-shadow: inset 2px 0 0 var(--gb-signal); }
.gb-thread-main { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; padding: 9px 8px; border: 0; background: transparent; text-align: left; }
.gb-thread-icon { display: grid; place-items: center; width: 18px; height: 18px; color: var(--gb-faint); }
.gb-thread.is-active .gb-thread-icon { color: var(--gb-signal); }
.gb-thread-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.gb-thread-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; line-height: 1.25; }
.gb-thread-meta { font-size: 9px; color: var(--gb-faint); }
.gb-thread-difficulty { margin-left: 5px; padding: 0 4px; border: 1px solid var(--gb-line); border-radius: 999px; font-size: 7px; line-height: 11px; }
.gb-thread-difficulty.is-simple { color: var(--gb-signal); }
.gb-thread-difficulty.is-hard { color: var(--gb-warn); }
.gb-thread.is-running .gb-thread-meta { color: color-mix(in srgb, var(--gb-signal) 80%, var(--gb-muted)); }
.gb-thread-delete { display: none; place-items: center; width: 24px; height: 24px; margin-right: 4px; border: 0; border-radius: 6px; background: transparent; color: var(--gb-faint); }
.gb-thread:hover .gb-thread-delete { display: grid; }
.gb-thread-delete:hover { background: color-mix(in srgb, var(--gb-error) 14%, transparent); color: var(--gb-error); }
.gb-thread-pin { display: none; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 6px; background: transparent; color: var(--gb-faint); font-size: 12px; line-height: 1; }
.gb-thread:hover .gb-thread-pin, .gb-thread-pin.is-pinned { display: grid; }
.gb-thread-pin.is-pinned { color: var(--gb-signal); }
.gb-thread-pin:hover { background: color-mix(in srgb, var(--gb-panel-2) 70%, transparent); color: var(--gb-text); }
.gb-thread-archived-toggle { margin: 6px 8px 0; padding: 4px 8px; border: 1px dashed var(--gb-line); border-radius: 6px; background: transparent; color: var(--gb-faint); font-size: 8px; }
.gb-thread-archived-toggle:hover { color: var(--gb-text); border-color: var(--gb-line-strong); }
.gb-thread.is-dragging { opacity: .45; }
.gb-thread[draggable="true"] .gb-thread-main { cursor: grab; }
.gb-thread[draggable="true"] .gb-thread-main:active { cursor: grabbing; }
.gb-topbar-archive { display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 7px; border: 1px solid var(--gb-line); border-radius: 999px; background: transparent; color: var(--gb-faint); font-size: 8px; }
.gb-topbar-archive:hover { color: var(--gb-text); border-color: var(--gb-line-strong); }
.gb-thread-empty { padding: 14px 8px; font-size: 11px; color: var(--gb-faint); }
.gb-rail-grow { flex: 1; min-height: 12px; }
.gb-rail-foot { display: flex; flex-direction: column; gap: 9px; padding: 12px 6px 2px; border-top: 1px solid var(--gb-line); }
.gb-rail-foot-btn { display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 7px; border: 0; border-radius: 7px; background: transparent; color: var(--gb-muted); font-size: 11px; text-align: left; }
.gb-rail-foot-btn:hover { background: color-mix(in srgb, var(--gb-panel-2) 55%, transparent); color: var(--gb-text); }
.gb-local-badge { display: flex; align-items: center; gap: 6px; padding: 0 7px; font-size: 9px; letter-spacing: .08em; color: var(--gb-muted); }
.gb-host-line { padding: 0 7px; font-family: "Cascadia Code", Consolas, monospace; font-size: 8.5px; color: var(--gb-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gb-rail-close { display: none !important; margin-left: auto; }

/* main + topbar */
.gb-main { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; background: #080908 !important; }
.gb-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 62px; flex: none; padding: 9px 22px 9px 26px; border-bottom: 1px solid var(--gb-line); background: #080908 !important; -webkit-app-region: no-drag; }
.gb-topbar button, .gb-topbar textarea { -webkit-app-region: no-drag; }
.gb-topbar-left { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-width: 0; }
.gb-topbar-title { min-width: 0; }
.gb-topbar-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14.5px; font-weight: 620; letter-spacing: -.01em; cursor: text; }
.gb-topbar-input { width: min(420px, 42vw); padding: 3px 7px; border: 1px solid var(--gb-line-strong); border-radius: 6px; outline: 0; background: var(--gb-bg); color: var(--gb-text); font: inherit; font-size: 14.5px; font-weight: 620; letter-spacing: -.01em; }
.gb-topbar-status { display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 9.5px; letter-spacing: .06em; color: var(--gb-faint); }
.gb-topbar-meta { display: flex; align-items: center; gap: 14px; flex: none; color: var(--gb-faint); }
.gb-topbar-pill { display: inline-flex; align-items: center; gap: 5px; color: var(--gb-muted); font-size: 8px; letter-spacing: .12em; white-space: nowrap; }
.gb-topbar-pill svg { color: var(--gb-faint); }
.gb-icon-btn { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--gb-muted); transition: background .16s ease, color .16s ease, border-color .16s ease; }
.gb-icon-btn:hover { background: color-mix(in srgb, var(--gb-panel-2) 65%, transparent); color: var(--gb-text); border-color: var(--gb-line); }
.gb-icon-btn.is-on { color: var(--gb-signal); }
.gb-computer-btn { display: flex; align-items: center; gap: 7px; height: 32px; margin-left: 6px; padding: 0 11px; border: 1px solid var(--gb-line); border-radius: 8px; background: color-mix(in srgb, var(--gb-panel) 60%, transparent); color: var(--gb-muted); font-size: 11px; }
.gb-computer-btn:hover { color: var(--gb-text); border-color: var(--gb-line-strong); }
.gb-mobile-only { display: none; }
.gb-offline { display: flex; align-items: center; gap: 8px; padding: 7px 26px; border-bottom: 1px solid color-mix(in srgb, var(--gb-warn) 28%, var(--gb-line)); background: color-mix(in srgb, var(--gb-warn) 10%, transparent); color: var(--gb-warn); font-size: 11px; }
.gb-offline-sub { color: var(--gb-muted); }

/* chat */
.gb-chat-scroll { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: thin; scroll-behavior: smooth; }
.gb-pinned-wrap { position: relative; width: calc(100% - 76px); max-width: 880px; margin: 0 auto 6px; }
.gb-guide-backdrop { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,.55); backdrop-filter: blur(3px); }
.gb-guide { width: min(620px, 94vw); max-height: 88vh; overflow: auto; padding: 22px; border: 1px solid var(--gb-line); border-radius: 16px; background: var(--gb-panel); box-shadow: 0 24px 80px rgba(0,0,0,.35); }
.gb-guide-head { display: flex; align-items: center; gap: 12px; }
.gb-guide-mark { display: grid; place-items: center; width: 38px; height: 38px; flex: none; border-radius: 12px; color: var(--gb-signal); background: color-mix(in srgb, var(--gb-signal) 12%, transparent); border: 1px solid color-mix(in srgb, var(--gb-signal) 30%, var(--gb-line)); }
.gb-guide-headings { flex: 1; min-width: 0; }
.gb-guide-kicker { display: block; color: var(--gb-faint); font-family: "Cascadia Code", Consolas, monospace; font-size: 8px; letter-spacing: .12em; }
.gb-guide-headings h2 { margin: 3px 0 0; color: var(--gb-text); font-size: 17px; font-weight: 600; }
.gb-guide-progress { display: flex; gap: 6px; margin: 18px 0 14px; }
.gb-guide-dot { display: grid; place-items: center; width: 22px; height: 22px; padding: 0; border: 1px solid var(--gb-line); border-radius: 50%; background: transparent; color: var(--gb-faint); font-family: "Cascadia Code", Consolas, monospace; font-size: 8px; cursor: pointer; }
.gb-guide-dot.is-active { color: var(--gb-bg); background: var(--gb-signal); border-color: var(--gb-signal); }
.gb-guide-dot.is-done { color: var(--gb-signal); border-color: color-mix(in srgb, var(--gb-signal) 40%, var(--gb-line)); }
.gb-guide-body { padding: 16px; border: 1px solid var(--gb-line); border-radius: 12px; background: color-mix(in srgb, var(--gb-panel-2) 30%, transparent); }
.gb-guide-step { color: var(--gb-faint); font-family: "Cascadia Code", Consolas, monospace; font-size: 8px; letter-spacing: .1em; }
.gb-guide-body h3 { margin: 7px 0 6px; color: var(--gb-text); font-size: 15px; font-weight: 600; }
.gb-guide-body p { margin: 0; color: var(--gb-muted); font-size: 11px; line-height: 1.7; }
.gb-guide-list { display: flex; flex-direction: column; gap: 7px; margin: 14px 0 0; padding: 0; list-style: none; }
.gb-guide-list li { display: flex; align-items: flex-start; gap: 8px; color: var(--gb-muted); font-size: 10.5px; line-height: 1.6; }
.gb-guide-list li > svg { flex: none; margin-top: 2px; color: var(--gb-signal); }
.gb-guide-action { display: inline-flex; align-items: center; gap: 5px; margin-top: 16px; padding: 8px 11px; border: 1px solid color-mix(in srgb, var(--gb-signal) 38%, var(--gb-line)); border-radius: 8px; background: color-mix(in srgb, var(--gb-signal) 9%, transparent); color: var(--gb-signal); font-size: 10px; cursor: pointer; }
.gb-guide-action:hover { background: color-mix(in srgb, var(--gb-signal) 15%, transparent); }
.gb-guide-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 16px; }
.gb-guide-foot-right { display: flex; gap: 8px; }
.gb-replay { width: min(680px, 92vw); }
.gb-modal-title { color: var(--gb-text); font-size: 14px; font-weight: 600; letter-spacing: .01em; }
.gb-modal-sub { margin-top: 3px; color: var(--gb-faint); font-family: "Cascadia Code", Consolas, monospace; font-size: 9px; }
.gb-replay-body { flex: 1; min-height: 220px; max-height: 56vh; overflow: auto; padding: 18px; background: color-mix(in srgb, var(--gb-panel-2) 26%, transparent); }
.gb-replay-item { display: flex; flex-direction: column; gap: 8px; }
.gb-replay-author { color: var(--gb-signal); font-family: "Cascadia Code", Consolas, monospace; font-size: 9px; letter-spacing: .05em; }
.gb-replay-author.is-user { color: var(--gb-muted); }
.gb-replay-text { white-space: pre-wrap; overflow-wrap: anywhere; color: var(--gb-text); font-size: 12px; line-height: 1.75; }
.gb-replay-empty { color: var(--gb-faint); font-size: 11px; }
.gb-replay-controls { display: flex; align-items: center; gap: 10px; flex: none; padding: 12px 16px; border-top: 1px solid var(--gb-line); }
.gb-replay-controls input[type="range"] { flex: 1; accent-color: var(--gb-signal); }
.gb-model-warning { display: flex; align-items: flex-start; gap: 7px; width: calc(100% - 76px); max-width: 880px; margin: 0 auto 6px; padding: 7px 9px; border: 1px solid color-mix(in srgb, var(--gb-warn) 40%, var(--gb-line)); border-radius: 8px; background: color-mix(in srgb, var(--gb-warn) 10%, transparent); color: var(--gb-warn); }
.gb-problem { display: flex; gap: 10px; margin: 16px 0 16px 38px; padding: 12px 13px; border: 1px solid color-mix(in srgb, var(--gb-error) 36%, var(--gb-line)); border-radius: 11px; background: color-mix(in srgb, var(--gb-error) 7%, transparent); animation: gb-fade .25s ease both; }
.gb-problem-icon { display: grid; place-items: center; width: 26px; height: 26px; flex: none; border-radius: 7px; background: color-mix(in srgb, var(--gb-error) 13%, transparent); color: var(--gb-error); }
.gb-problem-body { flex: 1; min-width: 0; }
.gb-problem-title { color: var(--gb-text); font-size: 11px; font-weight: 650; }
.gb-problem-reason { margin: 5px 0 4px; color: var(--gb-muted); font-size: 10px; line-height: 1.6; overflow-wrap: anywhere; }
.gb-problem-tried { color: var(--gb-faint); font-size: 9px; line-height: 1.6; }
.gb-problem-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
.gb-problem-details { margin-top: 8px; color: var(--gb-faint); font-size: 9px; }
.gb-problem-details summary { cursor: pointer; }
.gb-problem-details pre { max-height: 180px; margin: 6px 0 0; overflow: auto; padding: 7px; border-radius: 6px; background: color-mix(in srgb, var(--gb-panel-2) 60%, transparent); color: var(--gb-muted); font-size: 8.5px; white-space: pre-wrap; overflow-wrap: anywhere; }
.gb-update-banner { display: flex; align-items: center; gap: 9px; width: calc(100% - 76px); max-width: 880px; margin: 0 auto 6px; padding: 7px 9px; border: 1px solid color-mix(in srgb, var(--gb-signal) 34%, var(--gb-line)); border-radius: 8px; background: color-mix(in srgb, var(--gb-signal) 8%, transparent); color: var(--gb-text); }
.gb-update-banner > svg { flex: none; color: var(--gb-signal); }
.gb-stall-banner { display: flex; align-items: center; gap: 8px; width: calc(100% - 76px); max-width: 880px; margin: 0 auto 6px; padding: 7px 9px; border: 1px solid color-mix(in srgb, var(--gb-warn) 40%, var(--gb-line)); border-radius: 8px; background: color-mix(in srgb, var(--gb-warn) 8%, transparent); color: var(--gb-warn); font-size: 9px; }
.gb-stall-banner > svg { flex: none; }
.gb-stall-banner > span { flex: 1; }
.gb-update-text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; font-size: 9px; }
.gb-update-text strong { font-size: 9px; }
.gb-update-text span { color: var(--gb-muted); }
.gb-model-warning-text { display: flex; flex-direction: column; gap: 2px; font-size: 9px; }
.gb-model-warning-text strong { font-size: 9px; }
.gb-model-warning-text span { color: var(--gb-muted); }
.gb-pinned { display: flex; align-items: center; gap: 6px; width: 100%; padding: 5px 9px; border: 1px solid var(--gb-line); border-radius: 8px; background: color-mix(in srgb, var(--gb-panel-2) 45%, transparent); }
.gb-pinned > svg { flex: none; color: var(--gb-signal); }
.gb-pinned-body { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; border: 0; background: transparent; text-align: left; cursor: pointer; }
.gb-pinned-label { flex: none; color: var(--gb-signal); font-size: 8px; }
.gb-pinned-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--gb-faint); font-size: 9px; }
.gb-pinned-count { flex: none; height: 18px; padding: 0 5px; border: 1px solid var(--gb-line); border-radius: 999px; background: transparent; color: var(--gb-muted); font-size: 8px; }
.gb-pinned-count:hover { border-color: var(--gb-line-strong); color: var(--gb-text); }
.gb-pinned-list { display: flex; flex-direction: column; gap: 2px; max-height: 180px; margin-top: 4px; padding: 4px; overflow: auto; border: 1px solid var(--gb-line); border-radius: 8px; background: var(--gb-panel); }
.gb-pinned-item { display: flex; align-items: center; gap: 4px; }
.gb-pinned-item-main { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; padding: 4px 6px; border: 0; border-radius: 5px; background: transparent; text-align: left; }
.gb-pinned-item-main:hover { background: color-mix(in srgb, var(--gb-panel-2) 65%, transparent); }
.gb-pinned-item-name { flex: none; color: var(--gb-signal); font-size: 8px; }
.gb-pinned-item-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--gb-faint); font-size: 8.5px; }
.gb-pinned-clear { flex: none; width: 18px; height: 18px; border: 0; border-radius: 5px; background: transparent; color: var(--gb-faint); font-size: 12px; }
.gb-pinned-clear:hover { background: color-mix(in srgb, var(--gb-error) 14%, transparent); color: var(--gb-error); }
.gb-search-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-start; justify-content: center; padding-top: 12vh; background: rgba(0,0,0,.45); backdrop-filter: blur(2px); }
.gb-search-panel { display: flex; flex-direction: column; width: min(640px, 92vw); max-height: 70vh; overflow: hidden; border: 1px solid var(--gb-line-strong); border-radius: 12px; background: var(--gb-panel); box-shadow: 0 30px 80px rgba(0,0,0,.45); }
.gb-search-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--gb-line); }
.gb-search-head input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--gb-text); font-size: 12px; outline: 0; }
.gb-search-close { width: 22px; height: 22px; border: 0; border-radius: 6px; background: transparent; color: var(--gb-faint); font-size: 15px; }
.gb-search-close:hover { background: color-mix(in srgb, var(--gb-panel-2) 70%, transparent); color: var(--gb-text); }
.gb-search-scope { display: flex; gap: 2px; flex: none; padding: 2px; border: 1px solid var(--gb-line); border-radius: 6px; }
.gb-search-scope-btn { padding: 2px 6px; border: 0; border-radius: 4px; background: transparent; color: var(--gb-faint); font-size: 8px; }
.gb-search-scope-btn.is-active { background: color-mix(in srgb, var(--gb-panel-2) 80%, transparent); color: var(--gb-text); }
.gb-pins-title { flex: 1; color: var(--gb-text); font-size: 12px; }
.gb-pin-row { display: flex; align-items: center; gap: 4px; }
.gb-pin-row .gb-search-item { flex: 1; min-width: 0; }
.gb-search-scope-btn { padding: 2px 6px; border: 0; border-radius: 4px; background: transparent; color: var(--gb-faint); font-size: 8px; }
.gb-search-scope-btn.is-active { background: color-mix(in srgb, var(--gb-panel-2) 80%, transparent); color: var(--gb-text); }
.gb-search-results { display: flex; flex-direction: column; gap: 2px; padding: 6px; overflow: auto; }
.gb-search-item { display: flex; flex-direction: column; gap: 2px; padding: 7px 8px; border: 0; border-radius: 7px; background: transparent; text-align: left; }
.gb-search-item:hover { background: color-mix(in srgb, var(--gb-panel-2) 65%, transparent); }
.gb-search-meta { color: var(--gb-faint); font-size: 8px; }
.gb-search-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--gb-muted); font-size: 9px; }
.gb-search-text mark { border-radius: 2px; background: color-mix(in srgb, var(--gb-signal) 32%, transparent); color: var(--gb-text); }
.gb-search-empty { padding: 16px; color: var(--gb-faint); font-size: 9px; text-align: center; }
.gb-command-list { display: flex; flex-direction: column; gap: 3px; padding: 4px; }
.gb-command-head { display: flex; align-items: center; gap: 7px; padding: 6px 8px 8px; color: var(--gb-faint); font-size: 8px; letter-spacing: .08em; text-transform: uppercase; }
.gb-command-head span { flex: 1; }
.gb-command-item { display: flex; align-items: center; gap: 9px; width: 100%; padding: 9px 9px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--gb-text); font-size: 11px; text-align: left; transition: background .15s ease, border-color .15s ease, transform .15s ease; }
.gb-command-item:hover { background: color-mix(in srgb, var(--gb-panel-2) 70%, transparent); border-color: var(--gb-line); transform: translateX(2px); }
.gb-command-item > svg { color: var(--gb-signal); flex: none; }
.gb-command-item > span { flex: 1; }
.gb-search-hint { margin: 6px 8px 4px; color: var(--gb-faint); font-size: 8px; line-height: 1.6; }
.gb-search-item.is-memory { border-left: 2px solid color-mix(in srgb, var(--gb-signal) 55%, transparent); }
.gb-search-item.is-thread { border-left: 2px solid color-mix(in srgb, var(--gb-accent) 55%, transparent); }
.gb-chat-inner { max-width: 880px; margin: 0 auto; padding: 30px 38px 10px; }
.gb-chat-inner.is-empty { display: flex; align-items: center; min-height: 100%; padding-top: 0; padding-bottom: 0; }
.gb-chat-spacer { height: 14px; }
.gb-history-load { display: flex; justify-content: center; padding: 4px 0 14px; }
.gb-history-end { color: var(--gb-faint); font-size: 8px; }
.gb-quote { display: block; width: 100%; margin: 4px 0 8px; padding: 6px 9px; border: 0; border-left: 2px solid var(--gb-line-strong); border-radius: 0 6px 6px 0; background: color-mix(in srgb, var(--gb-panel-2) 45%, transparent); text-align: left; cursor: pointer; }
.gb-quote:hover { border-left-color: var(--gb-signal); background: color-mix(in srgb, var(--gb-panel-2) 70%, transparent); }
.gb-quote-author { display: block; color: var(--gb-muted); font-size: 8px; }
.gb-quote p { margin: 2px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--gb-faint); font-size: 9px; }
.gb-quote-static { cursor: default; }
.gb-quote-static:hover { border-left-color: var(--gb-line-strong); background: color-mix(in srgb, var(--gb-panel-2) 45%, transparent); }
.gb-compose-quote { position: relative; display: flex; flex-direction: column; gap: 1px; margin: 0 0 7px; padding: 5px 26px 5px 8px; border-left: 2px solid var(--gb-signal); border-radius: 0 6px 6px 0; background: color-mix(in srgb, var(--gb-panel-2) 55%, transparent); }
.gb-compose-quote-label { color: var(--gb-muted); font-size: 8px; }
.gb-compose-quote p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--gb-faint); font-size: 9px; }
.gb-compose-quote-clear { position: absolute; top: 3px; right: 4px; width: 18px; height: 18px; border: 0; border-radius: 5px; background: transparent; color: var(--gb-faint); font-size: 12px; }
.gb-compose-quote-clear:hover { background: color-mix(in srgb, var(--gb-error) 14%, transparent); color: var(--gb-error); }
.gb-message-flash, .is-flash { animation: gb-flash 1.4s ease; }
@keyframes gb-flash { 0% { background: color-mix(in srgb, var(--gb-signal) 16%, transparent); } 100% { background: transparent; } }
.gb-meeting-minutes { margin-top: 10px; padding: 8px; border: 1px solid var(--gb-line); border-radius: 8px; }
.gb-meeting-minutes-head { display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--gb-muted); font-size: 9px; }
.gb-meeting-minutes p { max-height: 140px; margin: 0 0 6px; overflow: auto; color: var(--gb-faint); font-size: 9px; line-height: 1.5; white-space: pre-wrap; }
.gb-meeting-history { margin-top: 10px; }
.gb-meeting-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.gb-meeting-search { width: 100%; margin: 4px 0 6px; padding: 5px 7px; border: 1px solid var(--gb-line); border-radius: 7px; background: color-mix(in srgb, var(--gb-bg) 70%, transparent); color: var(--gb-text); font-size: 9px; outline: 0; }
.gb-meeting-search:focus { border-color: var(--gb-line-strong); }
.gb-meeting-history-head { margin-bottom: 4px; color: var(--gb-muted); font-size: 9px; }
.gb-meeting-history-item { padding: 4px 0; border-top: 1px solid var(--gb-line); }
.gb-meeting-history-item summary { display: flex; justify-content: space-between; gap: 6px; color: var(--gb-muted); font-size: 9px; cursor: pointer; }
.gb-meeting-history-item p { max-height: 160px; margin: 4px 0 0; overflow: auto; color: var(--gb-faint); font-size: 8.5px; line-height: 1.5; white-space: pre-wrap; }
.gb-jump { position: absolute; left: 50%; bottom: 134px; z-index: 5; display: flex; align-items: center; gap: 6px; transform: translateX(-50%); height: 28px; padding: 0 11px; border: 1px solid var(--gb-line-strong); border-radius: 999px; background: color-mix(in srgb, var(--gb-overlay) 92%, transparent); color: var(--gb-muted); font-size: 10.5px; box-shadow: 0 8px 30px rgba(0,0,0,.35); }
.gb-jump:hover { color: var(--gb-text); }

/* welcome */
.gb-welcome { width: 100%; padding: 24px 0 10px; animation: gb-fade .5s ease both; }
.gb-welcome-orb { position: relative; display: inline-flex; margin-bottom: 26px; }
.gb-welcome-ring { position: absolute; inset: -16px; border: 1px solid color-mix(in srgb, var(--gb-signal) 18%, transparent); border-radius: 50%; animation: gb-breathe 7s ease-in-out infinite; }
.gb-welcome-ring::after { content: ""; position: absolute; inset: 10px; border: 1px dashed color-mix(in srgb, var(--gb-signal) 12%, transparent); border-radius: 50%; }
.gb-kicker { font-size: 9px; letter-spacing: .22em; color: var(--gb-faint); text-transform: uppercase; }
.gb-kicker-small { font-size: 8px; letter-spacing: .18em; color: var(--gb-faint); }
.gb-hero-title { margin: 10px 0 12px; font-family: "Segoe UI Variable Display", "Segoe UI", "PingFang SC", "Microsoft YaHei UI", sans-serif; font-size: clamp(42px, 5.2vw, 66px); font-weight: 650; line-height: .96; letter-spacing: -.055em; }
.gb-hero-sub { max-width: 480px; margin: 0; font-size: 14px; line-height: 1.7; color: var(--gb-muted); }
.gb-chips { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; max-width: 660px; margin-top: 30px; }
.gb-chip { display: flex; align-items: center; gap: 10px; min-height: 46px; padding: 10px 13px; border: 1px solid var(--gb-line); border-radius: 11px; background: color-mix(in srgb, var(--gb-panel) 46%, transparent); color: var(--gb-muted); font-size: 11.5px; text-align: left; transition: background .16s ease, border-color .16s ease, color .16s ease, transform .16s ease; }
.gb-chip svg { color: var(--gb-faint); flex: none; }
.gb-chip:hover { transform: translateY(-1px); border-color: var(--gb-line-strong); background: color-mix(in srgb, var(--gb-panel-2) 62%, transparent); color: var(--gb-text); }
.gb-chip:hover svg { color: var(--gb-signal); }
.gb-welcome-foot { margin-top: 26px; font-family: "Cascadia Code", Consolas, monospace; font-size: 9px; letter-spacing: .04em; color: var(--gb-faint); }
.gb-welcome-team { display: inline-flex; align-items: center; gap: 9px; margin-top: 14px; padding: 9px 12px; border: 1px solid color-mix(in srgb, var(--gb-signal) 28%, var(--gb-line)); border-radius: 10px; background: color-mix(in srgb, var(--gb-signal) 6%, transparent); color: var(--gb-text); text-align: left; }
.gb-welcome-team:hover { border-color: color-mix(in srgb, var(--gb-signal) 50%, var(--gb-line)); background: color-mix(in srgb, var(--gb-signal) 10%, transparent); }
.gb-welcome-team > svg { color: var(--gb-signal); }
.gb-welcome-team-text { display: flex; flex-direction: column; gap: 2px; }
.gb-welcome-team-text strong { font-size: 10px; font-weight: 600; }
.gb-welcome-team-text small { color: var(--gb-faint); font-size: 8px; }
.gb-team-add { margin-top: 8px; }

/* messages */
.gb-user { display: flex; justify-content: flex-end; margin: 20px 0; animation: gb-fade .28s ease both; }
.gb-user-bubble { max-width: min(78%, 620px); padding: 11px 15px 8px; border: 1px solid var(--gb-line); border-radius: 17px 17px 4px 17px; background: color-mix(in srgb, var(--gb-panel-2) 88%, transparent); }
.gb-user.is-pending .gb-user-bubble { opacity: .72; }
.gb-user-text { white-space: pre-wrap; word-break: break-word; font-size: 14px; line-height: 1.62; }
.gb-user-meta { display: flex; align-items: center; justify-content: flex-end; gap: 5px; margin-top: 5px; font-size: 8.5px; color: var(--gb-faint); }
.gb-assistant { display: flex; gap: 12px; margin: 26px 0; animation: gb-fade .3s ease both; }
.gb-assistant-avatar { padding-top: 1px; }
.gb-assistant-body { flex: 1; min-width: 0; }
.gb-assistant-head { display: flex; align-items: center; gap: 7px; margin-bottom: 7px; font-size: 9.5px; color: var(--gb-faint); }
.gb-author { font-size: 10px; font-weight: 700; letter-spacing: .12em; color: var(--gb-text); }
.gb-time { color: var(--gb-faint); }
.gb-model-tag { margin-left: 2px; padding: 2px 5px; border: 1px solid var(--gb-line); border-radius: 4px; font-family: "Cascadia Code", Consolas, monospace; font-size: 7.5px; letter-spacing: .06em; color: var(--gb-faint); }
.gb-md { font-size: 14.3px; line-height: 1.76; word-break: break-word; }
.gb-attachments { display: flex; flex-direction: column; gap: 8px; margin: 2px 0 12px; }
.gb-attachment-group { display: flex; flex-direction: column; gap: 5px; }
.gb-attachment-group-label { color: var(--gb-faint); font-size: 8px; letter-spacing: .08em; text-transform: uppercase; }
.gb-attachment-group-row { display: flex; flex-wrap: wrap; gap: 7px; }
.gb-attachment { display: inline-flex; align-items: center; gap: 2px; max-width: min(100%, 400px); padding: 5px 6px 5px 9px; border: 1px solid var(--gb-line); border-radius: 8px; background: color-mix(in srgb, var(--gb-panel-2) 60%, transparent); color: var(--gb-text); font-size: 10px; }
.gb-attachment:hover { border-color: color-mix(in srgb, var(--gb-signal) 45%, var(--gb-line)); background: color-mix(in srgb, var(--gb-panel-2) 85%, transparent); }
.gb-attachment-main { display: inline-flex; align-items: center; gap: 7px; min-width: 0; padding: 2px 3px; border: 0; background: transparent; color: inherit; text-align: left; }
.gb-attachment-main > svg { flex: none; color: var(--gb-signal); }
.gb-attachment:focus-within { border-color: color-mix(in srgb, var(--gb-signal) 55%, var(--gb-line)); box-shadow: 0 0 0 2px color-mix(in srgb, var(--gb-signal) 18%, transparent); }
.gb-attachment-thumb { width: 28px; height: 28px; flex: none; border-radius: 5px; object-fit: cover; background: var(--gb-panel); }
.gb-attachment-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gb-attachment-copy { display: grid; place-items: center; width: 22px; height: 22px; flex: none; padding: 0; border: 0; border-radius: 5px; background: transparent; color: var(--gb-faint); }
.gb-attachment-copy:hover { color: var(--gb-text); background: color-mix(in srgb, var(--gb-line) 55%, transparent); }
.gb-attachment-lightbox { position: fixed; inset: 0; z-index: 240; display: grid; place-items: center; padding: 32px; background: rgba(0, 0, 0, .74); backdrop-filter: blur(8px); animation: gb-fade .16s ease both; }
.gb-attachment-lightbox img { max-width: min(92vw, 1200px); max-height: 82vh; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; box-shadow: 0 28px 90px rgba(0,0,0,.55); object-fit: contain; transition: transform .12s ease; user-select: none; }
.gb-attachment-lightbox-stage { display: grid; place-items: center; max-width: 92vw; max-height: 82vh; overflow: hidden; touch-action: none; }
.gb-attachment-lightbox-stage.is-zoomed { cursor: grab; }
.gb-attachment-lightbox-stage.is-zoomed:active { cursor: grabbing; }
.gb-attachment-lightbox-close { position: absolute; right: 24px; bottom: 24px; display: inline-flex; align-items: center; gap: 6px; min-width: 34px; height: 34px; padding: 0 12px; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; background: rgba(0,0,0,.55); color: #fff; font-size: 10px; }
.gb-attachment-lightbox-close:hover { background: rgba(255,255,255,.14); }
.gb-attachment-lightbox-download { position: absolute; right: 112px; bottom: 24px; display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; background: rgba(0,0,0,.55); color: #fff; font-size: 10px; text-decoration: none; }
.gb-attachment-lightbox-download:hover { background: rgba(255,255,255,.14); }
.gb-attachment-lightbox-count { position: absolute; left: 24px; bottom: 64px; color: rgba(255,255,255,.72); font-family: "Cascadia Code", Consolas, monospace; font-size: 10px; letter-spacing: .06em; }
.gb-attachment-lightbox-zoom { position: absolute; left: 24px; bottom: 24px; display: inline-flex; align-items: center; gap: 3px; padding: 3px; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; background: rgba(0,0,0,.55); color: #fff; font-size: 10px; }
.gb-attachment-lightbox-zoom button { min-width: 26px; height: 26px; padding: 0 7px; border: 0; border-radius: 999px; background: transparent; color: #fff; font-size: 11px; }
.gb-attachment-lightbox-zoom button:hover { background: rgba(255,255,255,.14); }
.gb-attachment-lightbox-zoom span { min-width: 36px; text-align: center; font-family: "Cascadia Code", Consolas, monospace; font-size: 9px; color: rgba(255,255,255,.72); }
.gb-attachment-lightbox-nav { position: absolute; top: 50%; transform: translateY(-50%); display: grid; place-items: center; width: 42px; height: 42px; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; background: rgba(0,0,0,.5); color: #fff; }
.gb-attachment-lightbox-nav:hover { background: rgba(255,255,255,.16); }
.gb-attachment-lightbox-nav.is-prev { left: 22px; }
.gb-attachment-lightbox-nav.is-next { right: 22px; }
.gb-attachment-lightbox button:focus-visible, .gb-attachment-lightbox a:focus-visible { outline: 2px solid #c8ff5a; outline-offset: 2px; }
.gb-md p { margin: 0 0 12px; }
.gb-md p:last-child { margin-bottom: 0; }
.gb-md-heading { margin: 18px 0 8px; font-size: 15px; line-height: 1.4; font-weight: 650; letter-spacing: -.01em; }
.gb-md-list { margin: 0 0 12px; padding-left: 20px; }
.gb-md-list li { margin: 4px 0; }
.gb-md-quote { margin: 0 0 12px; padding: 2px 0 2px 13px; border-left: 2px solid var(--gb-line-strong); color: var(--gb-muted); }
.gb-md-quote p { margin: 0 0 6px; }
.gb-link { color: var(--gb-signal); text-decoration: none; border-bottom: 1px solid color-mix(in srgb, var(--gb-signal) 35%, transparent); }
.gb-link:hover { border-bottom-color: var(--gb-signal); }
.gb-inline-code { padding: 1px 5px; border: 1px solid var(--gb-line); border-radius: 4px; background: color-mix(in srgb, var(--gb-panel-2) 70%, transparent); font-family: "Cascadia Code", Consolas, monospace; font-size: .88em; }
.gb-codeblock { margin: 12px 0; border: 1px solid var(--gb-line); border-radius: 11px; overflow: hidden; background: color-mix(in srgb, #050605 78%, var(--gb-panel)); }
.gb-codeblock-head { display: flex; align-items: center; justify-content: space-between; height: 30px; padding: 0 10px 0 12px; border-bottom: 1px solid var(--gb-line); font-family: "Cascadia Code", Consolas, monospace; font-size: 8.5px; letter-spacing: .06em; color: var(--gb-faint); }
.gb-code-copy { display: flex; align-items: center; gap: 4px; padding: 3px 6px; border: 0; border-radius: 4px; background: transparent; color: var(--gb-faint); font-size: 8.5px; }
.gb-code-copy:hover { color: var(--gb-text); background: var(--gb-panel-2); }
.gb-codeblock pre { margin: 0; padding: 12px 13px; overflow-x: auto; font-family: "Cascadia Code", Consolas, monospace; font-size: 11.5px; line-height: 1.62; color: #dfe3d5; }
.gb-cursor { display: inline-block; width: 6px; height: 14px; margin-left: 2px; vertical-align: -2px; background: var(--gb-signal); animation: gb-blink 1s steps(2) infinite; }
.gb-typing { display: flex; align-items: center; gap: 4px; height: 20px; }
.gb-typing span { width: 5px; height: 5px; border-radius: 50%; background: var(--gb-muted); animation: gb-blink 1.2s ease-in-out infinite; }
.gb-typing span:nth-child(2) { animation-delay: .15s; }
.gb-typing span:nth-child(3) { animation-delay: .3s; }
.gb-message-tools { display: flex; align-items: center; gap: 2px; margin-top: 8px; opacity: 0; transition: opacity .16s ease; }
.gb-assistant:hover .gb-message-tools { opacity: 1; }
.gb-ghost-btn { display: inline-flex; align-items: center; gap: 5px; height: 25px; padding: 0 7px; border: 0; border-radius: 5px; background: transparent; color: var(--gb-faint); font-size: 9.5px; }
.gb-ghost-btn:hover { color: var(--gb-text); background: var(--gb-panel-2); }
.gb-reasoning { margin: 0 0 10px; }
.gb-reasoning-toggle { display: flex; align-items: center; gap: 5px; padding: 3px 7px 3px 4px; border: 1px solid var(--gb-line); border-radius: 5px; background: transparent; color: var(--gb-faint); font-size: 9px; }
.gb-reasoning-toggle:hover { color: var(--gb-muted); border-color: var(--gb-line-strong); }
.gb-reasoning-count { opacity: .55; font-family: "Cascadia Code", Consolas, monospace; font-size: 8px; }
.gb-reasoning-body { margin-top: 7px; padding: 10px 12px; border-left: 2px solid var(--gb-line-strong); color: var(--gb-muted); font-size: 11.5px; line-height: 1.65; white-space: pre-wrap; max-height: 240px; overflow-y: auto; }
.gb-reasoning-body p { margin: 0 0 5px; }
.gb-thought { margin: 0 0 16px 38px; border: 1px solid var(--gb-line); border-radius: 10px; overflow: hidden; background: color-mix(in srgb, var(--gb-panel) 58%, transparent); animation: gb-fade .3s ease both; }
.gb-thought.is-streaming { border-color: color-mix(in srgb, var(--gb-signal) 32%, var(--gb-line)); }
.gb-thought-head { display: flex; align-items: center; gap: 7px; padding: 8px 10px; }
.gb-thought-label { color: var(--gb-muted); font-size: 10px; letter-spacing: .02em; }
.gb-thought.is-streaming .gb-thought-label { color: var(--gb-signal); }
.gb-thought-count { flex: 1; color: var(--gb-faint); font-size: 8px; opacity: .65; }
.gb-thought-toggle { display: inline-flex; align-items: center; gap: 4px; padding: 3px 6px; border: 1px solid var(--gb-line); border-radius: 5px; background: transparent; color: var(--gb-faint); font-size: 8.5px; }
.gb-thought-toggle:hover { color: var(--gb-text); border-color: var(--gb-line-strong); }
.gb-thought-body { max-height: 300px; overflow-y: auto; padding: 9px 12px 11px; border-top: 1px solid var(--gb-line); color: var(--gb-muted); font-size: 11.5px; line-height: 1.68; white-space: pre-wrap; }
.gb-thought-body p { margin: 0 0 5px; }

/* activity */
.gb-run { margin: 15px 0 15px 38px; border: 1px solid var(--gb-line); border-radius: 12px; overflow: hidden; background: color-mix(in srgb, var(--gb-panel) 42%, transparent); animation: gb-fade .3s ease both; }
.gb-run.is-running { border-color: color-mix(in srgb, var(--gb-signal) 26%, var(--gb-line)); }
.gb-run.is-failed { border-color: color-mix(in srgb, var(--gb-error) 30%, var(--gb-line)); }
.gb-run-head { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 36px; padding: 0 11px; border: 0; background: transparent; color: var(--gb-muted); text-align: left; }
.gb-run-head:hover { background: color-mix(in srgb, var(--gb-panel-2) 40%, transparent); }
.gb-run-orb { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--gb-line); color: var(--gb-faint); }
.gb-run-orb.is-running { color: var(--gb-signal); border-color: color-mix(in srgb, var(--gb-signal) 36%, var(--gb-line)); }
.gb-run-title { flex: 1; font-size: 10.5px; color: var(--gb-muted); }
.gb-run-duration { color: var(--gb-faint); font-family: "Cascadia Code", Consolas, monospace; font-size: 9px; }
.gb-run-chevron { display: grid; place-items: center; color: var(--gb-faint); }
.gb-run-list { border-top: 1px solid var(--gb-line); }
.gb-act + .gb-act { border-top: 1px solid color-mix(in srgb, var(--gb-line) 65%, transparent); }
.gb-act-row { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 34px; padding: 0 11px; border: 0; background: transparent; color: var(--gb-muted); text-align: left; }
.gb-act-row:hover { background: color-mix(in srgb, var(--gb-panel-2) 38%, transparent); }
.gb-act-icon { display: grid; place-items: center; width: 16px; height: 16px; flex: none; color: var(--gb-faint); }
.gb-act-icon.is-done { color: var(--gb-success); }
.gb-act-icon.is-error { color: var(--gb-error); }
.gb-act-icon.is-running { color: var(--gb-signal); }
.gb-act-icon.is-stopped { color: var(--gb-warn); }
.gb-act-main { display: flex; align-items: baseline; gap: 7px; flex: 1; min-width: 0; }
.gb-act-label { flex: none; font-size: 10.5px; color: var(--gb-text); }
.gb-act-target { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: "Cascadia Code", Consolas, monospace; font-size: 9px; color: var(--gb-faint); }
.gb-act-duration { font-family: "Cascadia Code", Consolas, monospace; font-size: 8.5px; color: var(--gb-faint); }
.gb-act-detail { padding: 2px 11px 11px 35px; animation: gb-fade .2s ease both; }
.gb-act-section { margin-top: 7px; }
.gb-act-kicker { margin-bottom: 4px; font-size: 7.5px; letter-spacing: .14em; color: var(--gb-faint); }
.gb-act-section pre { margin: 0; padding: 8px 10px; border: 1px solid var(--gb-line); border-radius: 7px; background: color-mix(in srgb, #050605 60%, var(--gb-panel)); color: #c7ccbc; font-family: "Cascadia Code", Consolas, monospace; font-size: 9.5px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; max-height: 190px; overflow-y: auto; }
.gb-act-section.is-error pre { color: var(--gb-error); border-color: color-mix(in srgb, var(--gb-error) 30%, var(--gb-line)); }
.gb-notice { display: flex; align-items: center; gap: 8px; margin: 11px 0 11px 38px; padding: 8px 11px; border: 1px solid var(--gb-line); border-radius: 8px; background: color-mix(in srgb, var(--gb-panel) 40%, transparent); color: var(--gb-muted); font-size: 10.5px; }
.gb-notice.is-error { color: var(--gb-error); border-color: color-mix(in srgb, var(--gb-error) 26%, var(--gb-line)); background: color-mix(in srgb, var(--gb-error) 7%, transparent); }
.gb-notice.is-warn { color: var(--gb-warn); border-color: color-mix(in srgb, var(--gb-warn) 26%, var(--gb-line)); }
.gb-notice-text { flex: 1; min-width: 0; }
.gb-working-strip { display: flex; align-items: center; gap: 8px; margin: 16px 0 16px 38px; padding: 9px 12px; border: 1px dashed color-mix(in srgb, var(--gb-signal) 30%, var(--gb-line)); border-radius: 9px; color: var(--gb-muted); font-size: 10.5px; }
.gb-working-strip.is-waiting { color: var(--gb-warn); border-color: color-mix(in srgb, var(--gb-warn) 45%, var(--gb-line)); background: color-mix(in srgb, var(--gb-warn) 7%, transparent); }
.gb-working-target { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--gb-faint); font-family: "Cascadia Code", Consolas, monospace; font-size: 9px; }
.gb-spinner { display: inline-block; border: 1.4px solid color-mix(in srgb, currentColor 24%, transparent); border-top-color: currentColor; border-radius: 50%; animation: gb-spin .8s linear infinite; }

/* composer */
.gb-composer-wrap { flex: none; padding: 10px 38px 14px; background: linear-gradient(to top, var(--gb-bg) 58%, transparent); }
.gb-composer { position: relative; max-width: 880px; margin: 0 auto; padding: 11px 13px 8px; border: 1px solid var(--gb-line); border-radius: 15px; background: color-mix(in srgb, var(--gb-panel) 76%, transparent); box-shadow: 0 16px 50px rgba(0,0,0,.22), 0 0 0 1px color-mix(in srgb, #fff 2%, transparent) inset; transition: border-color .18s ease, box-shadow .18s ease; }
.gb-template-menu { position: absolute; left: 8px; bottom: calc(100% - 3px); z-index: 40; width: min(340px, 88vw); max-height: min(420px, 58vh); overflow: auto; padding: 6px; border: 1px solid var(--gb-line-strong); border-radius: 11px; background: var(--gb-panel); box-shadow: 0 18px 50px rgba(0,0,0,.45); }
.gb-template-head { display: flex; align-items: center; gap: 6px; padding: 5px 7px 7px; color: var(--gb-signal); font-size: 9px; letter-spacing: .04em; }
.gb-template-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 8px; border: 0; border-radius: 7px; background: transparent; color: var(--gb-text); text-align: left; font-size: 10px; }
.gb-template-item:hover { background: color-mix(in srgb, var(--gb-signal) 8%, transparent); color: var(--gb-signal); }
.gb-template-item > svg { flex: none; color: var(--gb-muted); }
.gb-mention-pop { position: absolute; left: 10px; right: 10px; bottom: calc(100% + 6px); z-index: 6; max-height: 220px; padding: 4px; overflow: auto; border: 1px solid var(--gb-line-strong); border-radius: 10px; background: var(--gb-panel); box-shadow: 0 16px 40px rgba(0,0,0,.3); }
.gb-mention-item { display: flex; align-items: center; gap: 7px; width: 100%; padding: 5px 7px; border: 0; border-radius: 6px; background: transparent; color: var(--gb-text); text-align: left; }
.gb-mention-item:hover { background: color-mix(in srgb, var(--gb-panel-2) 70%, transparent); }
.gb-mention-avatar { display: grid; place-items: center; width: 18px; height: 18px; border: 1px solid var(--gb-line); border-radius: 5px; font-size: 10px; }
.gb-mention-name { flex: 1; font-size: 9px; }
.gb-mention-role { color: var(--gb-faint); font-size: 7px; }
.gb-composer:focus-within { border-color: var(--gb-line-strong); box-shadow: 0 16px 50px rgba(0,0,0,.26), 0 0 0 1px color-mix(in srgb, var(--gb-signal) 12%, transparent); }
.gb-composer.is-running { border-color: color-mix(in srgb, var(--gb-signal) 20%, var(--gb-line)); }
.gb-input { display: block; width: 100%; max-height: 168px; min-height: 26px; padding: 3px 2px 2px; border: 0; outline: 0; resize: none; background: transparent; color: var(--gb-text); font-size: 14px; line-height: 1.62; scrollbar-width: thin; }
.gb-input::placeholder { color: var(--gb-faint); }
.gb-composer-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; padding-top: 5px; }
.gb-composer-hints { display: flex; align-items: center; gap: 12px; min-width: 0; padding-bottom: 3px; }
.gb-hint { font-size: 9px; color: var(--gb-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gb-hint-secondary { color: color-mix(in srgb, var(--gb-muted) 70%, transparent); }
.gb-composer-actions { display: flex; align-items: center; gap: 6px; flex: none; }
.gb-access-pill { display: inline-flex; align-items: center; gap: 5px; height: 18px; padding: 0 8px; border: 1px solid var(--gb-line); border-radius: 999px; background: color-mix(in srgb, var(--gb-panel-2) 55%, transparent); color: var(--gb-muted); font-size: 8px; }
.gb-admin-pill { display: inline-flex; align-items: center; height: 18px; padding: 0 8px; border: 1px solid color-mix(in srgb, var(--gb-warn) 45%, var(--gb-line)); border-radius: 999px; color: var(--gb-warn); font-size: 8px; }
.gb-admin-ack { display: flex; align-items: flex-start; gap: 7px; margin-top: 7px; color: var(--gb-warn); font-size: 9px; line-height: 1.55; }
.gb-admin-ack input { margin-top: 2px; accent-color: var(--gb-warn); }
.gb-attach-btn.is-listening { color: var(--gb-signal); border-color: color-mix(in srgb, var(--gb-signal) 60%, var(--gb-line)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--gb-signal) 14%, transparent); animation: gb-pulse 1.4s ease-in-out infinite; }
.gb-composer.is-dragging { border-color: var(--gb-signal); box-shadow: 0 0 0 1px color-mix(in srgb, var(--gb-signal) 30%, transparent), 0 16px 50px rgba(0,0,0,.26); }
.gb-drop-overlay { position: absolute; inset: 4px; z-index: 5; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px dashed var(--gb-signal); border-radius: 12px; background: color-mix(in srgb, var(--gb-signal) 10%, rgba(8,10,7,.92)); color: var(--gb-signal); font-size: 11px; pointer-events: none; }
.gb-attach-list { display: flex; flex-wrap: wrap; gap: 5px; padding: 2px 2px 7px; }
.gb-attach-chip { display: inline-flex; align-items: center; gap: 5px; max-width: 240px; height: 24px; padding: 0 5px 0 7px; border: 1px solid var(--gb-line); border-radius: 6px; background: color-mix(in srgb, var(--gb-panel-2) 60%, transparent); color: var(--gb-muted); font-size: 9px; }
.gb-attach-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gb-attach-thumb { width: 20px; height: 20px; object-fit: cover; border-radius: 4px; flex: none; }
.gb-attach-remove { display: grid; place-items: center; width: 16px; height: 16px; border: 0; border-radius: 4px; background: transparent; color: var(--gb-faint); font-size: 13px; line-height: 1; }
.gb-attach-remove:hover { color: var(--gb-error); background: color-mix(in srgb, var(--gb-error) 10%, transparent); }
.gb-attach-btn { display: grid; place-items: center; width: 31px; height: 31px; border: 1px solid var(--gb-line); border-radius: 8px; background: transparent; color: var(--gb-muted); }
.gb-attach-btn:hover:not(:disabled) { color: var(--gb-text); border-color: var(--gb-line-strong); background: var(--gb-panel-2); }
.gb-attach-btn:disabled { opacity: .5; }
.gb-attach-busy { width: 13px; height: 13px; border: 1.5px solid color-mix(in srgb, currentColor 25%, transparent); border-top-color: currentColor; border-radius: 50%; animation: gb-spin .8s linear infinite; }
.gb-send-btn { display: grid; place-items: center; width: 31px; height: 31px; border: 0; border-radius: 8px; background: var(--gb-text) !important; color: var(--gb-bg) !important; transition: transform .14s ease, opacity .14s ease; }
.gb-send-btn:hover:not(:disabled) { transform: translateY(-1px); }
.gb-send-btn:disabled { opacity: .25; }
.gb-composer:focus-within { border-color: color-mix(in srgb, var(--gb-signal) 38%, var(--gb-line)); box-shadow: 0 18px 55px rgba(0,0,0,.26), 0 0 0 3px color-mix(in srgb, var(--gb-signal) 10%, transparent); }
.gb-user-bubble { animation: gb-rise .22s cubic-bezier(.2,.8,.2,1) both; }
@keyframes gb-rise { from { opacity: 0; transform: translateY(7px) scale(.985) } to { opacity: 1; transform: none } }
.gb-stop-btn { display: flex; align-items: center; gap: 5px; height: 31px; padding: 0 9px; border: 1px solid color-mix(in srgb, var(--gb-error) 35%, var(--gb-line)); border-radius: 8px; background: color-mix(in srgb, var(--gb-error) 8%, transparent); color: var(--gb-error); font-size: 10px; }
.gb-stop-btn:hover { background: color-mix(in srgb, var(--gb-error) 14%, transparent); }
.gb-composer-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; max-width: 880px; margin: 8px auto 0; padding: 0 4px; font-size: 8.5px; color: var(--gb-faint); }
.gb-access-pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 6px; border: 1px solid var(--gb-line); border-radius: 4px; font-size: 8px; letter-spacing: .04em; color: var(--gb-muted); }
.gb-foot-left { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; row-gap: 4px; }
.gb-foot-btn { display: inline-flex; align-items: center; gap: 4px; height: 18px; padding: 0 6px; border: 1px solid var(--gb-line); border-radius: 4px; background: transparent; color: var(--gb-muted); font-size: 8px; letter-spacing: .04em; }
.gb-foot-icon { width: 20px; padding: 0; justify-content: center; }
.gb-rail-toggle { display: none !important; }
.gb-foot-btn:hover { color: var(--gb-text); border-color: var(--gb-line-strong); background: var(--gb-panel-2); }
.gb-difficulty { display: inline-flex; align-items: center; gap: 2px; height: 22px; padding: 2px; border: 1px solid var(--gb-line); border-radius: 999px; background: color-mix(in srgb, var(--gb-panel-2) 55%, transparent); }
.gb-difficulty-label { padding: 0 5px; color: var(--gb-faint); font-size: 7.5px; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
.gb-difficulty-btn { height: 16px; padding: 0 7px; border: 0; border-radius: 999px; background: transparent; color: var(--gb-faint); font-size: 8px; letter-spacing: .02em; cursor: pointer; transition: color .16s ease, background .16s ease, transform .16s ease; }
.gb-difficulty-btn:hover { color: var(--gb-text); }
.gb-difficulty-btn.is-active { color: var(--gb-bg); background: var(--gb-signal); box-shadow: 0 1px 6px color-mix(in srgb, var(--gb-signal) 20%, transparent); }
.gb-difficulty-btn.is-hard.is-active { background: var(--gb-warn); }
.gb-difficulty-btn:active { transform: scale(.94); }
.gb-difficulty-pill { display: inline-flex; align-items: center; height: 15px; padding: 0 6px; margin-left: 2px; border: 1px solid var(--gb-line); border-radius: 999px; font-size: 8px; letter-spacing: .04em; color: var(--gb-muted); }
.gb-difficulty-pill.is-simple { color: var(--gb-signal); border-color: color-mix(in srgb, var(--gb-signal) 38%, var(--gb-line)); }
.gb-difficulty-pill.is-hard { color: var(--gb-warn); border-color: color-mix(in srgb, var(--gb-warn) 42%, var(--gb-line)); }
.gb-composer-note { font-family: "Cascadia Code", Consolas, monospace; }

/* quality / checkpoint / skills */
.gb-quality-list { display: flex; flex-direction: column; gap: 3px; margin-top: 9px; }
.gb-quality-row { display: flex; align-items: center; gap: 6px; min-width: 0; padding: 4px 5px; border-radius: 5px; background: color-mix(in srgb, var(--gb-bg) 45%, transparent); }
.gb-quality-dot { width: 5px; height: 5px; border-radius: 50%; flex: none; background: var(--gb-faint); }
.gb-quality-dot.is-success { background: var(--gb-signal); }
.gb-quality-dot.is-failed { background: var(--gb-error); }
.gb-quality-dot.is-aborted { background: var(--gb-warn); }
.gb-quality-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--gb-muted); font-size: 8.5px; }
.gb-quality-verdict { flex: none; padding: 1px 4px; border-radius: 3px; font-size: 7px; color: var(--gb-faint); background: var(--gb-panel-2); }
.gb-quality-verdict.is-passed { color: var(--gb-signal); background: color-mix(in srgb, var(--gb-signal) 12%, transparent); }
.gb-quality-verdict.is-failed { color: var(--gb-error); background: color-mix(in srgb, var(--gb-error) 12%, transparent); }
.gb-quality-verdict.is-needs_review { color: var(--gb-warn); background: color-mix(in srgb, var(--gb-warn) 10%, transparent); }
.gb-quality-meta { flex: none; color: var(--gb-faint); font-size: 7.5px; font-family: "Cascadia Code", Consolas, monospace; }
.gb-safety-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 8px; margin-top: 5px; border: 1px solid color-mix(in srgb, var(--gb-warn) 20%, var(--gb-line)); border-radius: 7px; background: color-mix(in srgb, var(--gb-warn) 5%, transparent); }
.gb-safety-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.gb-safety-main b { font-size: 9.5px; color: var(--gb-text); font-weight: 550; }
.gb-safety-main small { font-size: 8px; color: var(--gb-faint); }
.gb-checkpoint { flex: none; width: 100%; max-width: 880px; margin: 0 auto 8px; padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--gb-warn) 28%, var(--gb-line)); border-radius: 10px; background: color-mix(in srgb, var(--gb-warn) 6%, var(--gb-bg)); }
.gb-checkpoint-head { display: flex; align-items: center; gap: 7px; color: var(--gb-warn); font-size: 10px; }
.gb-checkpoint-head span { margin-left: auto; font-size: 8px; }
.gb-checkpoint-prompt { margin: 7px 0 3px; color: var(--gb-text); font-size: 10.5px; line-height: 1.55; }
.gb-checkpoint-error { margin: 0 0 5px; color: var(--gb-error); font-size: 9px; }
.gb-checkpoint-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; }
.gb-checkpoint-hint { color: var(--gb-faint); font-size: 8px; }
.gb-skill-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.gb-skill-row { padding: 8px 9px; border: 1px solid var(--gb-line); border-radius: 8px; background: color-mix(in srgb, var(--gb-bg) 45%, transparent); }
.gb-skill-main { display: flex; flex-direction: column; gap: 2px; }
.gb-skill-main b { color: var(--gb-text); font-size: 10px; font-weight: 550; }
.gb-skill-main small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--gb-faint); font-size: 8px; }
.gb-skill-meta { display: flex; align-items: center; gap: 7px; margin-top: 4px; color: var(--gb-faint); font-size: 8px; }
.gb-skill-badge { padding: 1px 4px; border: 1px solid var(--gb-line); border-radius: 3px; color: var(--gb-signal); font-size: 7px; }
.gb-skill-actions { display: flex; align-items: center; gap: 5px; margin-top: 6px; }

/* pending question / approval */
.gb-pending-wrap { flex: none; width: 100%; max-width: 880px; margin: 0 auto; padding: 0 38px; }
.gb-pending { margin: 6px 0 8px; padding: 12px 14px; border: 1px solid color-mix(in srgb, var(--gb-signal) 26%, var(--gb-line)); border-radius: 12px; background: #0b0d09; box-shadow: 0 14px 40px rgba(0,0,0,.3); animation: gb-fade .25s ease both; }
.gb-pending.is-approval { border-color: color-mix(in srgb, var(--gb-warn) 30%, var(--gb-line)); }
.gb-pending-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.gb-pending-kicker { font-family: "Cascadia Code", Consolas, monospace; font-size: 7.5px; letter-spacing: .12em; color: var(--gb-signal); white-space: nowrap; }
.gb-pending.is-approval .gb-pending-kicker { color: var(--gb-warn); }
.gb-pending-title { flex: 1; font-size: 11px; color: var(--gb-text); }
.gb-pending-count { font-family: "Cascadia Code", Consolas, monospace; font-size: 8px; color: var(--gb-faint); }
.gb-pending-body { max-height: 38vh; overflow-y: auto; scrollbar-width: thin; }
.gb-pending-reason { display: flex; align-items: center; gap: 4px; font-family: "Cascadia Code", Consolas, monospace; font-size: 9.5px; color: var(--gb-muted); }
.gb-pending-reason b { color: var(--gb-text); font-weight: 600; }
.gb-pending-body p { margin: 7px 0 0; font-size: 11px; line-height: 1.6; color: var(--gb-muted); white-space: pre-wrap; }
.gb-pending-hint { margin-top: 8px; font-size: 8.5px; color: var(--gb-faint); }
.gb-question + .gb-question { margin-top: 13px; padding-top: 12px; border-top: 1px solid var(--gb-line); }
.gb-question-header { margin-bottom: 4px; font-family: "Cascadia Code", Consolas, monospace; font-size: 8px; letter-spacing: .1em; color: var(--gb-faint); }
.gb-question-text { font-size: 12px; line-height: 1.55; color: var(--gb-text); }
.gb-question-detail { margin: 7px 0 0; padding: 8px 9px; border: 1px solid var(--gb-line); border-radius: 7px; max-height: 150px; overflow-y: auto; background: #070806; color: var(--gb-muted); font-family: "Cascadia Code", Consolas, monospace; font-size: 9px; line-height: 1.55; white-space: pre-wrap; }
.gb-question-multi { margin-top: 5px; font-size: 8px; color: var(--gb-faint); }
.gb-question-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; margin-top: 8px; }
.gb-question-option { display: flex; align-items: center; gap: 7px; min-height: 34px; padding: 6px 9px; border: 1px solid var(--gb-line); border-radius: 8px; background: transparent; color: var(--gb-muted); font-size: 10px; text-align: left; }
.gb-question-option:hover { color: var(--gb-text); border-color: var(--gb-line-strong); background: var(--gb-panel-2); }
.gb-question-option.is-active { color: var(--gb-text); border-color: color-mix(in srgb, var(--gb-signal) 46%, var(--gb-line)); background: color-mix(in srgb, var(--gb-signal) 7%, transparent); }
.gb-option-mark { display: grid; place-items: center; width: 13px; height: 13px; flex: none; border: 1px solid var(--gb-line-strong); border-radius: 3px; font-size: 9px; color: var(--gb-signal); }
.gb-question-option.is-active .gb-option-mark { border-color: var(--gb-signal); }
.gb-question-custom { display: flex; align-items: center; gap: 8px; margin-top: 7px; }
.gb-question-custom span { flex: none; font-size: 8.5px; color: var(--gb-faint); }
.gb-question-custom input { flex: 1; min-width: 0; height: 27px; padding: 0 9px; border: 1px solid var(--gb-line); border-radius: 6px; outline: 0; background: #070806; color: var(--gb-text); font-size: 10px; }
.gb-question-custom input:focus { border-color: var(--gb-line-strong); }
.gb-pending-actions { display: flex; align-items: center; justify-content: flex-end; gap: 7px; margin-top: 10px; }
.gb-pending-btn { display: inline-flex; align-items: center; gap: 5px; height: 29px; padding: 0 11px; border: 1px solid var(--gb-line); border-radius: 7px; background: transparent; color: var(--gb-muted); font-size: 9.5px; }
.gb-pending-btn:hover:not(:disabled) { color: var(--gb-text); border-color: var(--gb-line-strong); background: var(--gb-panel-2); }
.gb-pending-btn.is-primary { border-color: var(--gb-text); background: var(--gb-text); color: var(--gb-bg); }
.gb-pending-btn.is-primary:hover:not(:disabled) { background: #fff; color: #070806; }
.gb-pending-btn:disabled { opacity: .45; }

/* right deck */
.gb-deck { display: flex; flex-direction: column; flex: none; width: 346px; min-height: 0; border-left: 1px solid var(--gb-line); background: #0a0b09 !important; animation: gb-slide .26s ease both; }
.gb-deck-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex: none; height: 62px; padding: 0 14px 0 16px; border-bottom: 1px solid var(--gb-line); }
.gb-deck-title { display: flex; flex-direction: column; gap: 3px; }
.gb-deck-name { font-size: 10px; font-weight: 680; letter-spacing: .14em; }
.gb-deck-head-right { display: flex; align-items: center; gap: 4px; }
.gb-live-pill { display: flex; align-items: center; gap: 5px; padding: 3px 6px; border: 1px solid var(--gb-line); border-radius: 4px; font-family: "Cascadia Code", Consolas, monospace; font-size: 7.5px; letter-spacing: .1em; color: var(--gb-muted); }
.gb-deck-close { display: grid; }
.gb-tabs { display: flex; align-items: center; gap: 2px; flex: none; padding: 8px 10px; border-bottom: 1px solid var(--gb-line); overflow-x: auto; scrollbar-width: none; }
.gb-tabs::-webkit-scrollbar { display: none; }
.gb-tab { display: flex; align-items: center; gap: 5px; flex: none; height: 28px; padding: 0 9px; border: 0; border-radius: 6px; background: transparent; color: var(--gb-faint); font-size: 10px; }
.gb-tab:hover { color: var(--gb-muted); background: color-mix(in srgb, var(--gb-panel-2) 45%, transparent); }
.gb-tab.is-active { color: var(--gb-text); background: var(--gb-panel-2); }
.gb-deck-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 12px 18px; scrollbar-width: thin; }
.gb-screen-card { margin-bottom: 8px; }
.gb-screen { position: relative; aspect-ratio: 16 / 10; overflow: hidden; border: 1px solid var(--gb-line); border-radius: 10px; background: #070807; box-shadow: 0 10px 32px rgba(0,0,0,.28); }
.gb-screen img, .gb-screen video { display: block; width: 100%; height: 100%; object-fit: cover; filter: saturate(.82) contrast(1.06) brightness(.94); }
.gb-scan { position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px); mix-blend-mode: screen; opacity: .7; }
.gb-screen-vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,.38) 100%); }
.gb-screen-top, .gb-screen-bottom { position: absolute; left: 9px; right: 9px; display: flex; align-items: center; justify-content: space-between; gap: 8px; font-family: "Cascadia Code", Consolas, monospace; font-size: 7.5px; letter-spacing: .08em; color: rgba(255,255,255,.58); text-shadow: 0 1px 3px rgba(0,0,0,.7); }
.gb-screen-top { top: 8px; }
.gb-screen-bottom { bottom: 8px; }
.gb-live-tag { display: flex; align-items: center; gap: 4px; color: var(--gb-signal); }
.gb-screen-actions { display: flex; align-items: center; gap: 5px; }
.gb-screen-btn { display: flex; align-items: center; gap: 3px; height: 20px; padding: 0 5px; border: 1px solid rgba(255,255,255,.16); border-radius: 4px; background: rgba(0,0,0,.45); color: rgba(255,255,255,.72); font-family: "Cascadia Code", Consolas, monospace; font-size: 7.5px; backdrop-filter: blur(4px); }
.gb-screen-btn:hover { color: #fff; border-color: rgba(255,255,255,.3); }
.gb-screen-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; width: 100%; height: 100%; padding: 14px; text-align: center; background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--gb-signal) 7%, transparent), transparent 62%), #070807; }
.gb-screen-empty-title { font-size: 11px; color: rgba(255,255,255,.74); }
.gb-screen-empty-sub { max-width: 220px; font-size: 8.5px; line-height: 1.55; color: rgba(255,255,255,.38); }
.gb-screen-note { margin-top: 5px; font-size: 8px; color: var(--gb-faint); text-align: right; }
.gb-small-btn { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 8px; border: 1px solid var(--gb-line); border-radius: 6px; background: color-mix(in srgb, var(--gb-panel) 60%, transparent); color: var(--gb-muted); font-size: 9px; }
.gb-small-btn:hover:not(:disabled) { color: var(--gb-text); border-color: var(--gb-line-strong); }
.gb-small-btn:disabled { opacity: .35; }
.gb-deck-section { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--gb-line); }
.gb-deck-section:first-child { border-top: 0; }
.gb-deck-section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; font-size: 9px; letter-spacing: .12em; color: var(--gb-faint); }
.gb-stat { margin-bottom: 10px; }
.gb-stat-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; font-size: 9.5px; color: var(--gb-muted); }
.gb-bar { height: 3px; border-radius: 2px; background: color-mix(in srgb, var(--gb-panel-2) 80%, transparent); overflow: hidden; }
.gb-bar-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, color-mix(in srgb, var(--gb-signal) 65%, var(--gb-muted)), var(--gb-signal)); transition: width .5s ease; }
.gb-stat-detail { margin-top: 4px; font-family: "Cascadia Code", Consolas, monospace; font-size: 8px; color: var(--gb-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gb-app-list { display: flex; flex-direction: column; gap: 1px; }
.gb-app-row { display: flex; align-items: center; gap: 7px; min-height: 34px; padding: 4px 2px; border-bottom: 1px solid color-mix(in srgb, var(--gb-line) 50%, transparent); }
.gb-app-row:last-child { border-bottom: 0; }
.gb-app-dot { width: 4px; height: 4px; flex: none; border-radius: 50%; background: color-mix(in srgb, var(--gb-signal) 58%, transparent); }
.gb-app-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.gb-app-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; color: var(--gb-muted); }
.gb-app-name { font-family: "Cascadia Code", Consolas, monospace; font-size: 7.5px; color: var(--gb-faint); }
.gb-app-cpu { font-family: "Cascadia Code", Consolas, monospace; font-size: 8px; color: var(--gb-faint); }
.gb-more-btn { width: 100%; margin-top: 5px; padding: 5px 0; border: 0; border-radius: 5px; background: transparent; color: var(--gb-faint); font-size: 8.5px; }
.gb-more-btn:hover { color: var(--gb-muted); background: var(--gb-panel-2); }
.gb-deck-empty { padding: 8px 0; font-size: 9px; color: var(--gb-faint); }
.gb-path { display: flex; align-items: center; gap: 6px; width: 100%; padding: 6px 7px; border: 1px solid var(--gb-line); border-radius: 6px; background: transparent; color: var(--gb-muted); font-family: "Cascadia Code", Consolas, monospace; font-size: 8.5px; text-align: left; overflow: hidden; }
.gb-path span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gb-path:hover { color: var(--gb-text); border-color: var(--gb-line-strong); }
.gb-meta-line { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 8px; font-family: "Cascadia Code", Consolas, monospace; font-size: 7.5px; color: var(--gb-faint); }
.gb-deck-copy { margin: 0 0 10px; font-size: 9.5px; line-height: 1.6; color: var(--gb-muted); }
.gb-team-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 30px 10px; color: var(--gb-faint); font-size: 10px; }
.gb-empty-title { color: var(--gb-text); font-size: 11px; font-weight: 600; }
.gb-empty-hint { max-width: 280px; color: var(--gb-faint); font-size: 9px; line-height: 1.6; text-align: center; }
.gb-routine-empty { gap: 7px; padding-bottom: 18px; }
.gb-routine-empty > b { color: var(--gb-text); font-size: 11px; font-weight: 600; }
.gb-routine-empty > span { max-width: 260px; color: var(--gb-faint); font-size: 9px; line-height: 1.6; text-align: center; }
.gb-routine-presets { display: flex; flex-direction: column; gap: 6px; width: min(100%, 300px); margin-top: 5px; }
.gb-routine-preset { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 10px; border: 1px solid var(--gb-line); border-radius: 8px; background: color-mix(in srgb, var(--gb-panel-2) 55%, transparent); color: var(--gb-muted); font-size: 9px; text-align: left; }
.gb-routine-preset:hover { border-color: color-mix(in srgb, var(--gb-signal) 45%, var(--gb-line)); color: var(--gb-text); }
.gb-routine-preset > svg:first-child { flex: none; color: var(--gb-signal); }
.gb-routine-preset > span { flex: 1; }
.gb-routine-preset > svg:last-child { opacity: .5; }
.gb-team-list { display: flex; flex-direction: column; gap: 5px; }
.gb-team-row { display: flex; align-items: center; gap: 8px; padding: 8px 9px; border: 1px solid var(--gb-line); border-radius: 7px; background: color-mix(in srgb, var(--gb-bg) 55%, transparent); }
.gb-team-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gb-faint); flex: none; }
.gb-team-dot.is-running { background: var(--gb-signal); box-shadow: 0 0 8px color-mix(in srgb, var(--gb-signal) 50%, transparent); }
.gb-team-id { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--gb-muted); font-size: 9px; }
.gb-team-status { flex: none; color: var(--gb-faint); font-family: "Cascadia Code", Consolas, monospace; font-size: 8px; text-transform: uppercase; letter-spacing: .08em; }
.gb-memory-input { width: 100%; min-height: 220px; padding: 9px 10px; border: 1px solid var(--gb-line); border-radius: 8px; outline: 0; resize: vertical; background: color-mix(in srgb, var(--gb-bg) 60%, transparent); color: var(--gb-text); font-family: "Cascadia Code", Consolas, monospace; font-size: 9.5px; line-height: 1.62; }
.gb-memory-input:focus { border-color: var(--gb-line-strong); }
.gb-memory-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; }
.gb-memory-actions .gb-mono { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* bots */
.gb-bot-strip { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin: 0 6px 10px; padding-bottom: 2px; max-height: 96px; overflow-y: auto; scrollbar-width: none; }
.gb-bot-strip::-webkit-scrollbar { display: none; }
.gb-bot-chip { display: flex; align-items: center; gap: 5px; flex: none; max-width: 104px; height: 28px; padding: 0 7px 0 4px; border: 1px solid var(--gb-line); border-radius: 7px; background: color-mix(in srgb, var(--gb-panel-2) 35%, transparent); color: var(--gb-muted); font-size: 9.5px; }
.gb-bot-chip:hover { color: var(--gb-text); border-color: var(--gb-line-strong); }
.gb-bot-chip.is-active { color: var(--gb-text); border-color: color-mix(in srgb, var(--gb-signal) 55%, var(--gb-line)); background: color-mix(in srgb, var(--gb-signal) 8%, var(--gb-panel-2)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gb-signal) 12%, transparent); }
.gb-bot-avatar { display: grid; place-items: center; width: 19px; height: 19px; border-radius: 5px; background: color-mix(in srgb, var(--gb-panel) 85%, transparent); font-size: 11px; line-height: 1; }
.gb-bot-chip.is-active .gb-bot-avatar { background: color-mix(in srgb, var(--gb-signal) 16%, var(--gb-panel)); }
.gb-bot-label { max-width: 62px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gb-bot-run { width: 4px; height: 4px; flex: none; border-radius: 50%; background: var(--gb-faint); opacity: .35; }
.gb-bot-run.is-running { background: var(--gb-signal); opacity: 1; box-shadow: 0 0 4px color-mix(in srgb, var(--gb-signal) 60%, transparent); }
.gb-bot-add, .gb-bot-edit { display: grid; place-items: center; flex: none; width: 24px; height: 26px; border: 1px dashed var(--gb-line); border-radius: 6px; background: transparent; color: var(--gb-faint); }
.gb-bot-edit { border-style: solid; margin-left: auto; }
.gb-bot-add:hover, .gb-bot-edit:hover { color: var(--gb-text); border-color: var(--gb-line-strong); background: var(--gb-panel-2); }
.gb-bot-add:disabled, .gb-bot-edit:disabled { opacity: .35; }

/* routines */
.gb-routine-form { display: flex; flex-direction: column; gap: 9px; margin: 2px 0 14px; padding: 10px; border: 1px solid color-mix(in srgb, var(--gb-signal) 22%, var(--gb-line)); border-radius: 9px; background: color-mix(in srgb, var(--gb-signal) 4%, transparent); }
.gb-routine-form .gb-field { margin: 0; }
.gb-routine-form-actions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
.gb-routine-form-actions .gb-primary-btn { margin-top: 0; height: 30px; }
.gb-routine-list { display: flex; flex-direction: column; gap: 7px; }
.gb-routine-card { display: flex; flex-direction: column; gap: 8px; padding: 10px; border: 1px solid var(--gb-line); border-radius: 9px; background: color-mix(in srgb, var(--gb-bg) 48%, transparent); }
.gb-routine-card.is-paused { opacity: .68; }
.gb-routine-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; }
.gb-routine-head b { font-size: 10.5px; color: var(--gb-text); }
.gb-routine-schedule { margin-left: auto; padding: 2px 5px; border: 1px solid var(--gb-line); border-radius: 4px; font-family: "Cascadia Code", Consolas, monospace; font-size: 7.5px; color: var(--gb-muted); }
.gb-routine-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--gb-faint); flex: none; }
.gb-routine-dot.is-on { background: var(--gb-signal); box-shadow: 0 0 8px color-mix(in srgb, var(--gb-signal) 50%, transparent); }
.gb-routine-meta { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 9px; line-height: 1.55; color: var(--gb-muted); }
.gb-routine-foot { display: flex; align-items: center; gap: 5px; font-family: "Cascadia Code", Consolas, monospace; font-size: 7.5px; color: var(--gb-faint); }
.gb-routine-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 3px; padding-top: 2px; border-top: 1px solid color-mix(in srgb, var(--gb-line) 55%, transparent); }
.gb-routine-actions .gb-ghost-btn { height: 24px; font-size: 8.5px; }
.gb-routine-actions .gb-danger-btn { margin-left: auto; }
.gb-weekdays { display: flex; flex-wrap: wrap; gap: 4px; }
.gb-weekday { width: 24px; height: 24px; border: 1px solid var(--gb-line); border-radius: 5px; background: transparent; color: var(--gb-faint); font-size: 9px; }
.gb-weekday.is-active { border-color: color-mix(in srgb, var(--gb-signal) 55%, var(--gb-line)); color: var(--gb-text); background: color-mix(in srgb, var(--gb-signal) 10%, transparent); }

/* modal + form fields */
.gb-modal-backdrop { position: fixed; inset: 0; z-index: 220; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,.58); backdrop-filter: blur(5px); animation: gb-fade .16s ease both; }
.gb-modal { display: flex; flex-direction: column; width: min(620px, 92vw); max-height: min(86vh, 780px); overflow: hidden; border: 1px solid var(--gb-line-strong); border-radius: 14px; background: #0c0e0b; box-shadow: 0 30px 90px rgba(0,0,0,.65), 0 0 0 1px color-mix(in srgb, #fff 3%, transparent) inset; }
.gb-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex: none; padding: 16px 16px 12px; border-bottom: 1px solid var(--gb-line); }
.gb-modal-head h2 { margin: 2px 0 0; font-size: 18px; font-weight: 620; letter-spacing: -.02em; }
.gb-modal-body { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding: 14px 16px; scrollbar-width: thin; }
.gb-modal-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex: none; padding: 12px 16px; border-top: 1px solid var(--gb-line); }
.gb-modal-foot-right { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.gb-modal-foot .gb-primary-btn, .gb-modal-foot .gb-ghost-btn, .gb-modal-foot .gb-danger-btn { margin-top: 0; }
.gb-modal-error { display: flex; align-items: flex-start; gap: 6px; padding: 7px 8px; border: 1px solid color-mix(in srgb, var(--gb-error) 30%, var(--gb-line)); border-radius: 6px; color: var(--gb-error); font-size: 9px; line-height: 1.5; }
.gb-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.gb-field > span { font-size: 8.5px; letter-spacing: .08em; color: var(--gb-faint); }
.gb-field small { font-size: 8px; line-height: 1.5; color: var(--gb-faint); }
.gb-field input, .gb-field select, .gb-field textarea { width: 100%; min-height: 32px; padding: 6px 8px; border: 1px solid var(--gb-line); border-radius: 6px; outline: 0; background: color-mix(in srgb, var(--gb-bg) 72%, transparent); color: var(--gb-text); font: inherit; font-size: 10.5px; line-height: 1.5; }
.gb-field textarea { min-height: 74px; resize: vertical; }
.gb-field input:focus, .gb-field select:focus, .gb-field textarea:focus { border-color: var(--gb-line-strong); }
.gb-field-emoji { flex: 0 0 70px; }
.gb-field-emoji input { font-size: 18px; text-align: center; padding: 2px; }
.gb-field-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.gb-danger-btn { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 9px; border: 1px solid color-mix(in srgb, var(--gb-error) 32%, var(--gb-line)); border-radius: 6px; background: color-mix(in srgb, var(--gb-error) 8%, transparent); color: var(--gb-error); font-size: 9px; }
.gb-danger-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--gb-error) 14%, transparent); border-color: var(--gb-error); }
.gb-danger-btn:disabled { opacity: .35; }

/* stats + activity */
.gb-stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.gb-stat-grid > div { display: flex; flex-direction: column; gap: 3px; padding: 9px 10px; border: 1px solid var(--gb-line); border-radius: 8px; background: color-mix(in srgb, var(--gb-panel-2) 35%, transparent); }
.gb-stat-grid b { font-family: "Cascadia Code", Consolas, monospace; font-size: 14px; font-weight: 500; }
.gb-stat-grid span { font-size: 8px; letter-spacing: .1em; color: var(--gb-faint); text-transform: uppercase; }
.gb-current-tool { display: flex; align-items: center; gap: 9px; margin-top: 12px; padding: 9px 10px; border: 1px solid color-mix(in srgb, var(--gb-signal) 24%, var(--gb-line)); border-radius: 8px; background: color-mix(in srgb, var(--gb-signal) 5%, transparent); color: var(--gb-muted); }
.gb-current-tool > div { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.gb-current-tool span { font-size: 7.5px; letter-spacing: .12em; color: var(--gb-faint); }
.gb-current-tool b { font-size: 10.5px; color: var(--gb-text); }
.gb-current-tool small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: "Cascadia Code", Consolas, monospace; font-size: 8px; color: var(--gb-faint); }
.gb-log-list { display: flex; flex-direction: column; }
.gb-log-row { display: flex; align-items: center; gap: 7px; min-height: 32px; border-bottom: 1px solid color-mix(in srgb, var(--gb-line) 50%, transparent); }
.gb-log-status { width: 5px; height: 5px; flex: none; border-radius: 50%; background: var(--gb-faint); }
.gb-log-status.is-running { background: var(--gb-signal); box-shadow: 0 0 8px var(--gb-signal); }
.gb-log-status.is-done { background: var(--gb-success); }
.gb-log-status.is-error { background: var(--gb-error); }
.gb-log-status.is-stopped { background: var(--gb-warn); }
.gb-log-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.gb-log-text b { font-size: 9.5px; font-weight: 500; color: var(--gb-muted); }
.gb-log-text small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: "Cascadia Code", Consolas, monospace; font-size: 7.5px; color: var(--gb-faint); }
.gb-log-time { font-family: "Cascadia Code", Consolas, monospace; font-size: 7.5px; color: var(--gb-faint); }
.gb-deck-error { display: flex; align-items: flex-start; gap: 7px; margin-top: 14px; padding: 9px; border: 1px solid color-mix(in srgb, var(--gb-error) 25%, var(--gb-line)); border-radius: 7px; color: var(--gb-error); font-size: 9px; line-height: 1.55; }

/* misc */
.gb-toast { position: fixed; left: 50%; bottom: 28px; z-index: 100; display: flex; align-items: center; gap: 8px; max-width: min(520px, 88vw); transform: translateX(-50%); padding: 9px 13px; border: 1px solid var(--gb-line-strong); border-radius: 9px; background: color-mix(in srgb, var(--gb-overlay) 94%, transparent); color: var(--gb-text); font-size: 10.5px; box-shadow: 0 18px 50px rgba(0,0,0,.4); animation: gb-fade .2s ease both; }
.gb-toast-text { min-width: 0; overflow-wrap: anywhere; }
.gb-toast-close { display: grid; place-items: center; width: 20px; height: 20px; flex: none; padding: 0; border: 0; border-radius: 5px; background: transparent; color: var(--gb-faint); }
.gb-toast-close:hover { background: color-mix(in srgb, var(--gb-line) 55%, transparent); color: var(--gb-text); }
.gb-toast:focus-visible, .gb-toast button:focus-visible { outline: 2px solid var(--gb-signal); outline-offset: 2px; }
.gb-rail-backdrop { display: none; }
.gb-deck-backdrop { display: none; }
.gb-loading { align-items: center; justify-content: center; }
.gb-loading-card { display: flex; flex-direction: column; align-items: center; gap: 10px; max-width: 560px; padding: 30px; text-align: center; }
.gb-loading-card h1 { margin: 4px 0 0; font-size: 32px; letter-spacing: -.04em; }
.gb-loading-card p { max-width: 420px; margin: 0; color: var(--gb-muted); font-size: 12px; line-height: 1.7; }
.gb-error-code { max-width: 520px; padding: 7px 9px; border: 1px solid var(--gb-line); border-radius: 5px; background: var(--gb-panel); color: var(--gb-error); font-family: "Cascadia Code", Consolas, monospace; font-size: 9px; overflow-wrap: anywhere; }
.gb-primary-btn { display: inline-flex; align-items: center; gap: 7px; height: 34px; margin-top: 10px; padding: 0 13px; border: 0; border-radius: 8px; background: var(--gb-text) !important; color: var(--gb-bg) !important; font-size: 11px; font-weight: 600; }
.gb-primary-btn:hover { background: color-mix(in srgb, var(--gb-text) 92%, var(--gb-signal)); }

@media (max-width: 1280px) {
  .gb-deck { width: 316px; }
  .gb-chat-inner { padding-left: 28px; padding-right: 28px; }
  .gb-composer-wrap, .gb-pending-wrap { padding-left: 28px; padding-right: 28px; }
}
@media (max-width: 1500px) {
  .gb-root.is-deck-open .gb-rail { display: none; }
  .gb-deck { position: relative; width: min(340px, 42vw); box-shadow: none; }
  .gb-deck-backdrop { display: none; }
}
@media (max-width: 1020px) {
  .gb-rail { position: fixed; top: 0; left: 0; bottom: 0; z-index: 80; width: 258px; transform: translateX(-102%); transition: transform .24s ease; box-shadow: 28px 0 70px rgba(0,0,0,.42); }
  .gb-rail.is-open { transform: none; }
  .gb-rail-backdrop { display: block; position: fixed; inset: 0; z-index: 75; background: rgba(0,0,0,.35); backdrop-filter: blur(2px); }
  .gb-rail-close { display: grid !important; }
  .gb-mobile-only { display: grid; }
  .gb-rail-toggle { display: inline-flex !important; }
  .gb-topbar { padding-left: 14px; padding-right: 14px; }
  .gb-chat-inner { padding-left: 22px; padding-right: 22px; }
  .gb-composer-wrap, .gb-pending-wrap { padding-left: 22px; padding-right: 22px; }
  .gb-chips { grid-template-columns: 1fr; }
  .gb-hero-title { font-size: clamp(38px, 8vw, 58px); }
}
@media (max-width: 760px) {
  .gb-deck { position: fixed; top: 0; right: 0; bottom: 0; width: 92vw; z-index: 120; box-shadow: -20px 0 60px rgba(0,0,0,.45); }
  .gb-topbar-meta .gb-topbar-pill:last-child { display: none; }
}
@media (max-width: 620px) {
  .gb-topbar-status .gb-mono, .gb-computer-btn span, .gb-composer-note, .gb-hint-secondary { display: none; }
  .gb-chat-inner { padding-left: 14px; padding-right: 14px; }
  .gb-composer-wrap { padding-left: 12px; padding-right: 12px; padding-bottom: 10px; }
  .gb-pending-wrap { padding-left: 12px; padding-right: 12px; }
  .gb-question-options { grid-template-columns: 1fr; }
  .gb-user-bubble { max-width: 88%; }
  .gb-assistant { gap: 9px; }
  .gb-run, .gb-notice, .gb-working-strip, .gb-thought { margin-left: 32px; }
  .gb-hero-title { font-size: 40px; }
  .gb-welcome { padding-top: 10px; }
  .gb-toast { bottom: 14px; }
}
/* markdown */
.gb-md-table-wrap { margin: 9px 0; overflow-x: auto; border: 1px solid var(--gb-line); border-radius: 8px; }
.gb-md-table { width: 100%; border-collapse: collapse; font-size: 10px; }
.gb-md-table th, .gb-md-table td { padding: 6px 9px; border-bottom: 1px solid var(--gb-line); text-align: left; vertical-align: top; }
.gb-md-table th { background: color-mix(in srgb, var(--gb-panel-2) 70%, transparent); color: var(--gb-text); font-size: 8.5px; letter-spacing: .06em; white-space: nowrap; }
.gb-md-table td { color: var(--gb-muted); }
.gb-md-table tr:last-child td { border-bottom: 0; }

/* team roster + delegations */
.gb-roster-list { display: flex; flex-direction: column; gap: 5px; margin-top: 8px; }
.gb-roster-row { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border: 1px solid var(--gb-line); border-radius: 8px; background: color-mix(in srgb, var(--gb-panel-2) 35%, transparent); }
.gb-roster-emoji { display: grid; place-items: center; width: 24px; height: 24px; flex: none; border: 1px solid var(--gb-line-strong); border-radius: 7px; background: var(--gb-panel-2); font-size: 13px; }
.gb-roster-text { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
.gb-roster-name { display: flex; align-items: center; gap: 5px; color: var(--gb-text); font-size: 10px; font-weight: 600; }
.gb-role-chip { padding: 0 5px; border: 1px solid var(--gb-line); border-radius: 999px; color: var(--gb-faint); font-size: 7px; font-weight: 400; }
.gb-role-chip.is-lead { border-color: color-mix(in srgb, var(--gb-signal) 40%, var(--gb-line)); color: var(--gb-signal); }
.gb-roster-meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--gb-faint); font-size: 8px; }
.gb-delegation-list { display: flex; flex-direction: column; gap: 5px; margin-top: 8px; }
.gb-team-filters { display: flex; flex-wrap: wrap; gap: 4px; margin: 8px 0 2px; }
.gb-team-filter { padding: 2px 7px; border: 1px solid var(--gb-line); border-radius: 999px; background: transparent; color: var(--gb-faint); font-size: 8px; }
.gb-team-filter:hover { color: var(--gb-text); border-color: var(--gb-line-strong); }
.gb-team-filter.is-active { color: var(--gb-text); border-color: color-mix(in srgb, var(--gb-signal) 45%, var(--gb-line)); background: color-mix(in srgb, var(--gb-signal) 7%, transparent); }
.gb-delegation-stats { color: var(--gb-faint); font-family: "Cascadia Code", Consolas, monospace; font-size: 7px; }
.gb-delegation-retry { align-self: flex-start; display: inline-flex; align-items: center; gap: 3px; margin-top: 2px; padding: 1px 6px; border: 1px solid var(--gb-line); border-radius: 999px; background: transparent; color: var(--gb-faint); font-size: 7.5px; }
.gb-delegation-actions { display: flex; align-items: center; gap: 5px; margin-top: 2px; }
.gb-delegation-retry-count { color: var(--gb-faint); font-size: 7px; }
.gb-delegation-retry:hover { color: var(--gb-text); border-color: var(--gb-line-strong); }
.gb-delegation-row { display: flex; flex-direction: column; gap: 3px; padding: 7px 8px; border: 1px solid var(--gb-line); border-radius: 8px; }
.gb-delegation-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.gb-delegation-route { color: var(--gb-muted); font-size: 9px; }
.gb-delegation-status { color: var(--gb-faint); font-size: 7.5px; }
.gb-delegation-status.is-success { color: var(--gb-success); }
.gb-delegation-status.is-running { color: var(--gb-signal); }
.gb-delegation-status.is-failed, .gb-delegation-status.is-aborted { color: var(--gb-error); }
.gb-delegation-summary { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--gb-faint); font-size: 8px; }

/* team assignment */
.gb-assignment { margin: 12px 0 12px 38px; border: 1px solid var(--gb-line); border-radius: 10px; background: color-mix(in srgb, var(--gb-panel-2) 55%, transparent); overflow: hidden; }
.gb-assignment-head { display: flex; align-items: center; gap: 9px; padding: 9px 11px; }
.gb-assignment-avatar { display: grid; place-items: center; width: 26px; height: 26px; flex: none; border: 1px solid var(--gb-line-strong); border-radius: 8px; background: var(--gb-panel-2); font-size: 14px; }
.gb-assignment-text { min-width: 0; flex: 1; }
.gb-assignment-title { display: flex; align-items: center; gap: 7px; font-size: 10px; color: var(--gb-muted); }
.gb-assignment-title strong { font-size: 11px; color: var(--gb-text); font-weight: 600; }
.gb-assignment-status { padding: 1px 6px; border: 1px solid var(--gb-line); border-radius: 999px; color: var(--gb-faint); font-size: 7.5px; letter-spacing: .06em; }
.gb-assignment.is-running { border-color: color-mix(in srgb, var(--gb-signal) 25%, var(--gb-line)); }
.gb-assignment.is-running .gb-assignment-status { color: var(--gb-signal); border-color: color-mix(in srgb, var(--gb-signal) 40%, var(--gb-line)); }
.gb-assignment.is-success .gb-assignment-status { color: var(--gb-success); border-color: color-mix(in srgb, var(--gb-success) 35%, var(--gb-line)); }
.gb-assignment.is-failed .gb-assignment-status, .gb-assignment.is-aborted .gb-assignment-status { color: var(--gb-error); border-color: color-mix(in srgb, var(--gb-error) 35%, var(--gb-line)); }
.gb-assignment-task { margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 9px; color: var(--gb-faint); }
.gb-assignment-meta { margin-top: 2px; color: var(--gb-faint); font-family: "Cascadia Code", Consolas, monospace; font-size: 7.5px; }
.gb-assignment-actions { display: flex; justify-content: flex-end; margin-top: 6px; }
.gb-assignment-retry-count { margin-left: 4px; color: var(--gb-faint); font-size: 7px; }
.gb-assignment-summary { padding: 7px 11px 10px; border-top: 1px solid color-mix(in srgb, var(--gb-line) 60%, transparent); }
.gb-assignment-summary span { font-size: 7.5px; letter-spacing: .1em; color: var(--gb-faint); }
.gb-assignment-summary p { margin: 4px 0 0; font-size: 10px; line-height: 1.6; color: var(--gb-muted); white-space: pre-wrap; word-break: break-word; }

/* memory history */
.gb-memory-dirty { margin-top: 6px; padding: 3px 7px; border: 1px solid color-mix(in srgb, var(--gb-warn) 35%, var(--gb-line)); border-radius: 5px; color: var(--gb-warn); font-size: 8px; }
.gb-memory-history { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.gb-memory-commit { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; padding: 7px 8px; border: 1px solid var(--gb-line); border-radius: 7px; background: transparent; color: var(--gb-muted); text-align: left; }
.gb-memory-commit:hover { border-color: var(--gb-line-strong); color: var(--gb-text); }
.gb-memory-commit.is-active { border-color: color-mix(in srgb, var(--gb-signal) 45%, var(--gb-line)); background: color-mix(in srgb, var(--gb-signal) 6%, transparent); color: var(--gb-text); }
.gb-memory-commit-sha { font-family: "Cascadia Code", Consolas, monospace; font-size: 8px; color: var(--gb-signal); }
.gb-memory-commit-subject { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 9px; }
.gb-memory-commit-time { font-size: 8px; color: var(--gb-faint); }
.gb-memory-diff-wrap { margin-top: 8px; border: 1px solid var(--gb-line); border-radius: 8px; overflow: hidden; }
.gb-memory-diff-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px; border-bottom: 1px solid var(--gb-line); color: var(--gb-faint); font-size: 8px; }
.gb-memory-diff { margin: 0; padding: 8px; max-height: 260px; overflow: auto; color: var(--gb-muted); font-family: "Cascadia Code", Consolas, monospace; font-size: 8px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }

/* group channels */
.gb-section-action { display: inline-flex; align-items: center; gap: 3px; margin-left: 6px; padding: 2px 7px; border: 1px solid var(--gb-line); border-radius: 999px; background: transparent; color: var(--gb-faint); font-size: 7.5px; letter-spacing: .06em; }
.gb-section-action:hover { color: var(--gb-text); border-color: var(--gb-line-strong); }
.gb-thread-stack { position: relative; display: inline-block; width: 20px; height: 15px; }
.gb-thread-stack i { position: absolute; top: 0; display: grid; place-items: center; width: 14px; height: 14px; border: 1px solid var(--gb-line-strong); border-radius: 4px; background: var(--gb-panel-2); font-style: normal; font-size: 8.5px; }
.gb-thread-stack i:nth-child(1) { left: 0; z-index: 2; }
.gb-thread-stack i:nth-child(2) { left: 6px; z-index: 1; opacity: .78; }
.gb-topbar-members { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
.gb-topbar-member { display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 7px; border: 1px solid var(--gb-line); border-radius: 999px; background: color-mix(in srgb, var(--gb-panel-2) 60%, transparent); color: var(--gb-muted); font-size: 8.5px; }
.gb-topbar-member i { font-style: normal; font-size: 10px; }
.gb-topbar-member.is-running { border-color: color-mix(in srgb, var(--gb-signal) 45%, var(--gb-line)); color: var(--gb-text); box-shadow: 0 0 12px color-mix(in srgb, var(--gb-signal) 12%, transparent); }
.gb-topbar-manage { display: inline-flex; align-items: center; gap: 3px; height: 20px; padding: 0 7px; border: 1px dashed var(--gb-line); border-radius: 999px; background: transparent; color: var(--gb-faint); font-size: 8px; }
.gb-topbar-manage:hover { color: var(--gb-text); border-color: var(--gb-line-strong); }
.gb-assistant-avatar.is-member { display: grid; place-items: start; }
.gb-member-avatar { display: grid; place-items: center; width: 26px; height: 26px; border: 1px solid var(--gb-line-strong); border-radius: 8px; background: color-mix(in srgb, var(--gb-panel-2) 82%, transparent); font-size: 14px; }
.gb-run-speaker { display: inline-flex; align-items: center; gap: 4px; margin-right: 4px; padding: 1px 6px; border: 1px solid var(--gb-line); border-radius: 999px; color: var(--gb-muted); font-size: 8px; }
.gb-run-speaker i { font-style: normal; font-size: 9px; }
.gb-mention-row { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; flex: none; padding: 8px 38px 0; }
.gb-mention-label { font-size: 7.5px; letter-spacing: .1em; color: var(--gb-faint); }
.gb-mention { display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 8px; border: 1px solid var(--gb-line); border-radius: 999px; background: color-mix(in srgb, var(--gb-panel-2) 55%, transparent); color: var(--gb-muted); font-size: 9px; }
.gb-mention:hover { color: var(--gb-text); border-color: color-mix(in srgb, var(--gb-signal) 40%, var(--gb-line)); }
.gb-mention i { font-style: normal; }
.gb-mention.is-all { border-style: dashed; }
.gb-mention.is-running { border-color: color-mix(in srgb, var(--gb-signal) 42%, var(--gb-line)); color: var(--gb-text); }
.gb-mention-hint { margin-left: auto; font-size: 7.5px; color: var(--gb-faint); }
.gb-modal-group { width: min(560px, 92vw); }
.gb-member-picks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
.gb-member-pick { display: flex; align-items: center; gap: 8px; padding: 8px 9px; border: 1px solid var(--gb-line); border-radius: 9px; background: color-mix(in srgb, var(--gb-bg) 55%, transparent); color: var(--gb-muted); text-align: left; }
.gb-member-pick:hover { border-color: var(--gb-line-strong); }
.gb-member-pick.is-on { border-color: color-mix(in srgb, var(--gb-signal) 50%, var(--gb-line)); background: color-mix(in srgb, var(--gb-signal) 7%, transparent); color: var(--gb-text); }
.gb-member-pick-avatar { display: grid; place-items: center; width: 28px; height: 28px; flex: none; border: 1px solid var(--gb-line-strong); border-radius: 8px; background: var(--gb-panel-2); font-size: 15px; }
.gb-member-pick-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.gb-member-pick-text strong { font-size: 10.5px; font-weight: 600; }
.gb-member-pick-text small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 8px; color: var(--gb-faint); }
.gb-member-pick > svg { margin-left: auto; color: var(--gb-signal); flex: none; }
@media (max-width: 620px) {
  .gb-mention-row { padding-left: 12px; padding-right: 12px; }
  .gb-member-picks { grid-template-columns: 1fr; }
  .gb-mention-hint { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .gb-root *, .gb-root *::before, .gb-root *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
}
`

    return {
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        let offLocale = null
        try {
          offLocale = ctx.locale.register(NS, COPY)
        } catch (error) {
          console.error('[dsh-bot] locale registration failed', error)
        }
        ctx.effect(() => () => {
          try {
            offLocale?.()
          } catch {
            /* ignore */
          }
        })

        ctx.effect(() => {
          const timer = setTimeout(() => {
            try {
              if (localStorage.getItem('dshbot.autoOpened.v3') === '1') return
              localStorage.setItem('dshbot.autoOpened.v3', '1')
              ctx.layout.selectPanel(PANEL_ID)
            } catch {
              /* storage or layout unavailable */
            }
          }, 800)
          const onKey = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && String(event.key).toLowerCase() === 'b') {
              event.preventDefault()
              try {
                ctx.layout.selectPanel(PANEL_ID)
              } catch {
                /* layout unavailable */
              }
            }
          }
          window.addEventListener('keydown', onKey)
          return () => {
            clearTimeout(timer)
            window.removeEventListener('keydown', onKey)
          }
        }, 'dsh-bot: panel shortcuts')

        class BotErrorBoundary extends React.Component {
          constructor(props) {
            super(props)
            this.state = { error: null, copied: false }
            this.retry = this.retry.bind(this)
            this.copy = this.copy.bind(this)
          }

          static getDerivedStateFromError(error) {
            return { error }
          }

          componentDidCatch(error, info) {
            const payload = {
              message: String(error?.message || error || 'unknown'),
              stack: String(error?.stack || '').slice(0, 4000),
              componentStack: String(info?.componentStack || '').slice(0, 4000),
              at: Date.now(),
              version: '5.28.0',
            }
            try {
              localStorage.setItem('dsh-bot-last-error', JSON.stringify(payload))
            } catch {
              /* storage is best effort */
            }
            console.error('[dsh-bot] render crashed', payload)
          }

          retry() {
            this.setState({ error: null, copied: false })
          }

          copy() {
            const error = this.state.error
            const text = JSON.stringify(
              {
                message: String(error?.message || error || ''),
                stack: String(error?.stack || ''),
                at: new Date().toISOString(),
                version: '5.28.0',
              },
              null,
              2,
            )
            try {
              navigator.clipboard?.writeText(text)
              this.setState({ copied: true })
            } catch {
              /* clipboard unavailable */
            }
          }

          render() {
            if (!this.state.error) return this.props.children
            return h(
              'div',
              {
                style: {
                  minHeight: '100dvh',
                  display: 'grid',
                  placeItems: 'center',
                  padding: 24,
                  background: '#080908',
                  color: '#f1f2ed',
                  fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
                },
              },
              h(
                'div',
                {
                  style: {
                    width: 'min(520px, 92vw)',
                    padding: 24,
                    border: '1px solid #2b332a',
                    borderRadius: 16,
                    background: '#101410',
                    boxShadow: '0 24px 80px #0008',
                  },
                },
                h('div', { style: { color: '#c8ff5a', fontSize: 10, letterSpacing: '.12em' } }, 'DSH BOT · SAFE MODE'),
                h('h2', { style: { margin: '8px 0 8px', fontSize: 20 } }, '界面出了点问题，任务没有丢'),
                h(
                  'p',
                  { style: { margin: '0 0 14px', color: '#9a9d94', fontSize: 12, lineHeight: 1.7 } },
                  '后台任务通常还在运行。先点“重试渲染”；如果还是不行，复制诊断信息发给开发者，不要反复刷新页面。',
                ),
                h(
                  'pre',
                  {
                    style: {
                      maxHeight: 150,
                      overflow: 'auto',
                      padding: 10,
                      borderRadius: 8,
                      background: '#080b08',
                      color: '#ff8a8a',
                      fontSize: 10,
                      whiteSpace: 'pre-wrap',
                    },
                  },
                  String(this.state.error?.message || this.state.error || 'unknown error').slice(0, 1200),
                ),
                h(
                  'div',
                  { style: { display: 'flex', gap: 8, marginTop: 14 } },
                  h(
                    'button',
                    {
                      type: 'button',
                      onClick: this.retry,
                      style: { padding: '8px 14px', border: 0, borderRadius: 8, background: '#c8ff5a', color: '#07100b', fontWeight: 700, cursor: 'pointer' },
                    },
                    '重试渲染',
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      onClick: this.copy,
                      style: { padding: '8px 14px', border: '1px solid #3a3d34', borderRadius: 8, background: 'transparent', color: '#f1f2ed', cursor: 'pointer' },
                    },
                    this.state.copied ? '已复制' : '复制诊断',
                  ),
                ),
              ),
            )
          }
        }

        const Page = () => h(BotErrorBoundary, null, h(App, { ctx }))
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS }, Page),
        )
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: PANEL_ID, order: 20, locale: NS, label: () => translate(ctx, 'panel') },
            BotIcon,
          ),
        )
      },
    }
  },
})

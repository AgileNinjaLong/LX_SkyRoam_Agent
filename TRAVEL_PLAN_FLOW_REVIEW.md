# 创建攻略代码链路梳理

本文档用于梳理“创建一个攻略”从前端提交到后端异步生成、再到详情页展示的完整代码链路，并记录当前实现中的重点风险与可优化点，方便后续核对与重构。

## 1. 主流程总览

用户在前端填写旅行需求后，系统大致按如下顺序执行：

1. 前端提交表单，先创建一条 `travel_plans` 记录。
2. 创建成功后，前端再调用“生成方案”接口。
3. 后端把计划状态更新为 `generating`，并投递 Celery 任务。
4. Celery Worker 调用 `AgentService.generate_travel_plans(...)`。
5. `AgentService` 收集数据、保存预览、清洗数据、生成方案、评分排序、保存结果。
6. 计划状态更新为 `completed` 或 `failed`。
7. 前端通过 SSE 或轮询读取状态，完成后跳转到详情页。

## 2. 前端入口

### 2.1 页面入口

前端页面位于：

- [frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx:370)

关键方法是：

- `handleSubmit`
- `generatePlans`
- `pollGenerationStatus`

### 2.2 创建计划

`handleSubmit` 会先构造创建计划的请求体，核心字段包括：

- `title`
- `departure`
- `destination`
- `start_date`
- `end_date`
- `duration_days`
- `budget`
- `transportation`
- `preferences`
- `requirements`

这里写入数据库的偏好结构是：

```ts
preferences: {
  interests: values.preferences,
  travelers: values.travelers,
  foodPreferences: values.foodPreferences,
  dietaryRestrictions: values.dietaryRestrictions,
  ageGroups: values.ageGroups
}
```

然后前端调用：

- `POST /travel-plans/`

对应代码位置：

- [frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx:381)

### 2.3 启动生成

创建计划成功后，前端紧接着调用：

- `POST /travel-plans/{planId}/generate`

这里传入的是另一套“生成偏好”结构：

```ts
preferences: {
  budget_priority: preferences.budget < 3000 ? 'low' : 'medium',
  activity_preference: preferences.preferences || ['culture'],
  travelers: preferences.travelers,
  foodPreferences: preferences.foodPreferences,
  dietaryRestrictions: preferences.dietaryRestrictions,
  ageGroups: preferences.ageGroups
},
requirements: requirementsPayload,
num_plans: 3
```

对应代码位置：

- [frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx:456)

### 2.4 状态展示

前端优先使用 SSE：

- `GET /travel-plans/{planId}/status/stream`

如果 SSE 不可用，则回退到轮询：

- `GET /travel-plans/{planId}/status`

对应代码位置：

- [frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx:478)
- [frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx:537)

## 3. 后端 API 链路

后端主入口位于：

- [backend/app/api/v1/endpoints/travel_plans.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/api/v1/endpoints/travel_plans.py:39)

### 3.1 创建计划接口

接口：

- `POST /api/v1/travel-plans/`

函数：

- `create_travel_plan(...)`

逻辑：

1. 获取当前用户 `current_user`
2. 将 `current_user.id` 写入 `user_id`
3. 调用 `TravelPlanService.create_travel_plan(...)`

对应位置：

- [backend/app/api/v1/endpoints/travel_plans.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/api/v1/endpoints/travel_plans.py:39)

### 3.2 启动生成接口

接口：

- `POST /api/v1/travel-plans/{plan_id}/generate`

函数：

- `generate_travel_plans(...)`

逻辑：

1. 查计划是否存在
2. 校验用户权限
3. 若状态已经是 `generating`，拒绝再次生成
4. 将状态更新为 `generating`
5. 投递 Celery 任务 `generate_travel_plans_task.delay(...)`

对应位置：

- [backend/app/api/v1/endpoints/travel_plans.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/api/v1/endpoints/travel_plans.py:331)

### 3.3 状态接口

普通状态查询：

- `GET /api/v1/travel-plans/{plan_id}/status`

SSE 状态流：

- `GET /api/v1/travel-plans/{plan_id}/status/stream`

这两个接口都依赖数据库中的：

- `travel_plans.status`
- `travel_plans.generated_plans`
- `travel_plans.selected_plan`

对应位置：

- [backend/app/api/v1/endpoints/travel_plans.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/api/v1/endpoints/travel_plans.py:426)
- [backend/app/api/v1/endpoints/travel_plans.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/api/v1/endpoints/travel_plans.py:447)

## 4. Service 层

### 4.1 TravelPlanService

文件：

- [backend/app/services/travel_plan_service.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/services/travel_plan_service.py:107)

`create_travel_plan(...)` 的职责：

1. 标准化 `travelers`、`ageGroups`、`foodPreferences`、`dietaryRestrictions`
2. 将旅行者相关信息统一写回 `preferences`
3. 构造 `TravelPlan` ORM 对象
4. 提交数据库

### 4.2 AgentService

文件：

- [backend/app/services/agent_service.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/services/agent_service.py:35)

`generate_travel_plans(...)` 主流程如下：

1. `_get_travel_plan(plan_id)`
2. `_update_plan_status(plan_id, "generating")`
3. `_collect_data(...)`
4. `_save_raw_preview(...)`
5. `_process_data(...)`
6. `_generate_plans(...)`
7. `_score_plans(...)`
8. `_save_generated_plans(...)`
9. `_set_selected_plan_default(...)`
10. `_update_plan_status(plan_id, "completed")`

其中 `_collect_data(...)` 会收集：

- `flights`
- `hotels`
- `attractions`
- `weather`
- `restaurants`
- `transportation`
- `xiaohongshu_notes`

如果没有出发地，则跳过航班和交通数据采集。

### 4.3 PlanGenerator

文件：

- [backend/app/services/plan_generator.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/services/plan_generator.py:178)

`generate_plans(...)` 会：

1. 标准化偏好
2. 判断目的地范围是否为海外
3. 判断是否需要分段生成
4. 优先尝试 LLM 生成
5. LLM 失败时降级到传统方案生成

## 5. Celery 任务链路

文件：

- [backend/app/tasks/travel_plan_tasks.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/tasks/travel_plan_tasks.py:14)

任务入口：

- `generate_travel_plans_task(...)`

逻辑：

1. 设置任务进度为 `PROGRESS`
2. 创建异步数据库会话
3. 调用 `AgentService.generate_travel_plans(...)`
4. 根据返回值更新 Celery task 的 `SUCCESS` 或 `FAILURE`

注意：前端当前主要依赖计划表的 `status` 字段，而不是 Celery task 的进度信息。

## 6. 数据库存储点

主表：

- `travel_plans`

模型定义：

- [backend/app/models/travel_plan.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/models/travel_plan.py:8)

关键字段：

- `preferences`
- `requirements`
- `generated_plans`
- `selected_plan`
- `status`
- `score`

其中：

- `generated_plans` 存多个备选攻略或预览数据
- `selected_plan` 存最终选中的攻略
- `status` 用于驱动前端状态展示

## 7. 当前实现中的主要问题

### 7.1 `num_plans` 参数未真正贯穿

前端在生成请求里传了：

- `num_plans: 3`

schema 也定义了这个字段：

- [backend/app/schemas/travel_plan.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/schemas/travel_plan.py:147)

但后端实际投递 Celery 时只传了：

- `request.preferences`
- `request.requirements`

没有传 `num_plans`：

- [backend/app/api/v1/endpoints/travel_plans.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/api/v1/endpoints/travel_plans.py:351)

而 `PlanGenerator.generate_plans(...)` 也没有 `num_plans` 参数：

- [backend/app/services/plan_generator.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/services/plan_generator.py:178)

结论：

- 当前“生成几个攻略方案”不是一个真正受控的参数。

### 7.2 防重复生成不是原子操作

生成接口里先做状态判断：

- `if plan.status == "generating": ...`

再做状态更新：

- `await agent_service._update_plan_status(plan_id, "generating")`

对应位置：

- [backend/app/api/v1/endpoints/travel_plans.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/api/v1/endpoints/travel_plans.py:347)

问题在于：

- 这两个步骤不是同一个原子事务
- 如果两个请求同时进来，可能都在旧状态下通过检查，然后分别投递任务

虽然 `_update_plan_status(...)` 内部有行级锁：

- [backend/app/services/agent_service.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/services/agent_service.py:127)

但锁发生在“检查之后”，无法完全避免双提交。

### 7.3 SSE 回退到轮询的判断可能读到旧状态

前端代码中有：

```ts
if (!finished && generationStatus === 'generating') {
  await pollGenerationStatus(planId);
}
```

对应位置：

- [frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx:524)

问题在于：

- `generationStatus` 是 React state
- 这里读取到的可能是闭包中的旧值
- 如果 SSE 中断，兜底轮询可能不触发

这是典型的 stale closure 风险。

### 7.4 创建计划和生成计划使用了两套偏好语义

创建计划时写库的是：

- `preferences.interests`

对应位置：

- [frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx:390)

生成时传给后端的是：

- `preferences.activity_preference`
- `preferences.budget_priority`

对应位置：

- [frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/frontend/src/pages/TravelPlanPage/TravelPlanPage.tsx:461)

这会导致：

- 数据库存储结构和生成器消费结构不一致
- 历史计划重放、编辑后重新生成、回溯分析时容易错位

### 7.5 Celery 任务进度没有被前端真正利用

Celery 已经维护了任务进度：

- [backend/app/tasks/travel_plan_tasks.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/tasks/travel_plan_tasks.py:21)

后端也提供了查询接口：

- [backend/app/api/v1/endpoints/travel_plans.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/api/v1/endpoints/travel_plans.py:390)

但前端当前主要依赖：

- `travel_plans.status`
- SSE 中按时间推算出来的 `progress`

这会导致：

- 进度条不精确
- 难以定位“卡在数据采集还是卡在 LLM”
- `task_id` 的价值没有被用起来

### 7.6 `generated_plans` 同时承担“预览数据”和“最终结果”

在 `AgentService` 中：

- `_save_raw_preview(...)` 会把原始预览写入 `generated_plans`
- `_save_generated_plans(...)` 最终再把正式结果写回 `generated_plans`

对应位置：

- [backend/app/services/agent_service.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/services/agent_service.py:92)
- [backend/app/services/agent_service.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/services/agent_service.py:338)
- [backend/app/services/agent_service.py](/home/long123456/Desktop/workspace/travel_test_ai/LX_SkyRoam_Agent/backend/app/services/agent_service.py:433)

这虽然能工作，但语义上比较混：

- 一个字段既表示“预览态”
- 又表示“正式攻略结果”

长期维护时容易引发：

- 状态识别分支越来越多
- 详情页和创建页都需要识别 `is_preview`

## 8. 建议的优化方向

### 8.1 统一偏好结构

建议统一为一套 DTO：

- 前端表单
- 数据库存储
- 生成器输入

三者都用同一个字段语义，避免 `interests` 和 `activity_preference` 并存。

### 8.2 打通 `num_plans`

建议把 `num_plans` 从以下链路完整透传：

1. API request schema
2. `generate_travel_plans` endpoint
3. Celery task
4. `AgentService.generate_travel_plans`
5. `PlanGenerator.generate_plans`

### 8.3 用原子方式防重复生成

建议把“状态检查”和“状态切换”合并成一次条件更新，例如：

- 仅当 `status != 'generating'` 时更新为 `generating`
- 根据受影响行数判断是否成功抢到执行权

这样可以避免并发双投递。

### 8.4 优化前端状态流控制

建议：

- 不要依赖闭包中的旧 state 判断是否轮询
- 使用 `ref` 或单独的 request context 管理当前生成任务

### 8.5 让前端真正使用 `task_id`

建议在创建页显示两类状态：

- 计划状态：`draft/generating/completed/failed`
- 任务进度：数据收集、模型调用、评分、落库

这样排错和体验都会更清晰。

### 8.6 分离预览数据与最终结果

建议新增单独字段，例如：

- `generation_preview`

或者单独表存阶段性产物，避免 `generated_plans` 混用。

## 9. 结论

当前“创建攻略”的总体链路是清晰且可运行的：

- 前端表单 -> 创建计划 -> 异步生成 -> 状态回传 -> 详情页展示

但从工程稳定性和后续维护性看，最值得优先处理的是以下三点：

1. `num_plans` 没有真正生效
2. 生成接口存在并发重复触发风险
3. SSE 失败后的轮询兜底可能因为旧 state 判断而失效

如果后续继续优化，建议优先从“统一偏好结构”和“生成状态原子化控制”两块开始。

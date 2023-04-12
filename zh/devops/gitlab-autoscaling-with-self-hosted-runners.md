# Gitlab 自托管 runner 的弹性伸缩

## Background

目前公司在使用 self host 的 GitLab 来管理代码，并且也在借助 GitLab 的 CI/CD 功能做 DevOps。具体的做法是在 Azure 上新建了10 个 VM，然后将每个 VM 都注册成为 GitLab 的 Runner，以便运行 CI/CD 的任务。

然而，随着项目数量的增多和单项目数量和功能的增多，会经常出现 GitLab 的 Job 排队等待空闲 Runner 的情况。但如果贸然继续增加注册成为 Runner 的 VM 也会提高成本，那么如何能在控制成本的情况下也能尽量减少 Job 的等待时间呢？

## Environment

- GitLab: v15.3.3-ee
- Azure
- Docker Machine: 0.16.2-gitlab.11

## Target

根据 GitLab 官方文档，GitLab 本身也使用了 Docker Machine autoscale 机制来应对每月上百万次的 CI/CD 请求。此方案完全满足要求，只不过 GitLab 官方只提供了 AWS 下的配置，没有提供 Azure 的配置，因此本次的任务目标是：

- 按照 GitLab 的官方的 Autoscale 机制，在 Azure 上实现同样的 Autoscale 功能

## 完整流程

### 新注册一个 Docker Machine 的 Runner

首先先了解一下什么是 Docker Machine，我一开始在注册 Runner 的时候看到有个 Docker+machine 的选项，一直以为是既支持 Docker 又支持本地运行的意思。后来试着玩了一下才知道，原来 docker+machine 是 docker machine 被转义了，😂。Docker Machine 其实是一个 Docker 官方开发的工具，支持在本地或者云上的虚拟机，通过各种 Driver 来创建新的 VM 然后再在创建的 VM 上安装 Docker 并能管理和删除的一个很有用的工具。

1. 首先在 Azure 上创建一个 VM
2. 按照[文档](https://docs.gitlab.com/runner/register/)注册一个 Executor 是 Docker Machine 的 Runner

### 编写 Runner 的配置文件

参考[文档](https://itnext.io/autoscale-gitlab-runners-in-aws-gcp-and-azure-b9b6f4d7e17) 编写配置文件，通过 Docker Machine Azure 的 [Driver](https://gitlab.com/gitlab-org/ci-cd/docker-machine/-/blob/main/drivers/azure/azure.go)可以具体查看需要设置哪些变量。
另外支持从环境变量里直接读取变量。

我当前的 `/etc/gitlab-runner/config.toml` 文件
```toml
concurrent = 2
check_interval = 0

[session_server]
  session_timeout = 1800

[[runners]]
  name = "weiqiang-gitlab-runner"
  url = "http://20.194.254.196/"
  id = 1
  token = "CN9cfP3cs-A9Ld_sfgew"
  token_obtained_at = 2022-09-12T09:55:56Z
  token_expires_at = 0001-01-01T00:00:00Z
  executor = "docker+machine"
  [runners.custom_build_dir]
  [runners.cache]
    [runners.cache.s3]
    [runners.cache.gcs]
    [runners.cache.azure]
  [runners.docker]
    tls_verify = false
    image = "alpine"
    privileged = false
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = ["/cache"]
    shm_size = 0
  [runners.machine]
    MachineDriver = "azure"
    MachineName = "wqtest-%s"
    MachineOptions = [
      "azure-subscription-id=ae903ce3-6221-48e0-a5a2-ddea9fbf6162",
      "azure-client-id=85c98bdd-c73a-4bdf-8b9e-13127a12128e",
      "azure-client-secret=M4o8Q~-t.7onh0kbIV2yZP5p6aVPXv3PAQIZ6buK",
      "azure-resource-group=weiqiang-test",
      "azure-location=japaneast",
      "azure-image=Canonical:UbuntuServer:18.04-LTS:latest",
    ]
```

`/etc/environment` 环境变量文件
```shell
export AZURE_SUBSCRIPTION_ID="ae903ce3-6221-48e0-a5a2-ddea9fbf6162"
export AZURE_CLIENT_ID="85c98bdd-c73a-4bdf-8b9e-13127a12128e"
export AZURE_CLIENT_SECRET="M4o8Q~-t.7onh0kbIV2yZP5p6aVPXv3PAQIZ6buK"
export AZURE_RESOURCE_GROUP="weiqiang-test"
export AZURE_LOCATION="japaneast"
export AZURE_IMAGE="Canonical:UbuntuServer:18.04-LTS:latest"
```

最容易出问题的环节就是 Azure 的 VM 参数配置，`azure-image` 我弄错了好多次，因为如果使用默认的 Ubuntu 16 会导致 Docker 安装不上，就想用过新版本的，结果一直报错，后来才弄明白到底怎么配置。

还碰到一个导致一直报错的配置，就是 `MachineName = "wqtest-%s"` 这里，一开始我为了要和其他的 VM 区分开，名字就写的长了一些，结果怎么都报错，后来通过 `tail -f /var/log/syslog` 查看系统日志才发现，原来 Runner 又往名字前后加了一堆字符，导致名字超过 63 个字符，被 Azure 给嫌弃了，我……

## 实际效果

后面在使用 CI/CD 功能的时候就会看到 Azure 上真的动态创建出来了 VM，然后正常执行完 Job 以后还会被自动销毁掉，非常丝滑。

## 问题

使用弹性伸缩以后也会带来一些其他的问题，例如

- 新的 Job 到来时，因为涉及到新建 VM 和安装 Docker，会大概花费 4 分钟左右的时间

## 参考资料

- [Autoscale Gitlab Runners in AWS, GCP and Azure](https://itnext.io/autoscale-gitlab-runners-in-aws-gcp-and-azure-b9b6f4d7e17)
- [Docker Machine Executor autoscale configuration](https://docs.gitlab.com/runner/configuration/autoscale.html)
- [GitLab - Runner Executors](https://docs.gitlab.com/runner/executors/)


import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { CommandOperations } from "./CommandOperations";
import { CommitMessageModal } from "./CommitMessageModal";

// Remember to rename these classes and interfaces!

interface QuartzPublishSettings {
	quartzPath: string;
	mdPath: string;
	htmlPath: string;
	syncToMd: boolean;
}

const DEFAULT_SETTINGS: QuartzPublishSettings = {
	quartzPath: "",
	mdPath: "",
	htmlPath: "",
	syncToMd: false,
};


export default class QuartzPublishPlugin extends Plugin {
	settings: QuartzPublishSettings;

	async onload() {
		console.log("加载插件");
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("🔄 待发布");

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new QuartzPublishSettingTab(this.app, this));

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Quartz Publish",
			(evt: MouseEvent) => {
				if (!this.checkConfig()) {
					return;
				}

				// 同步笔记到 Quartz
				this.syncToQuartz(statusBarItemEl);
				if (this.settings.syncToMd) {
					this.syncToMd(statusBarItemEl);
				}
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	// 调用 git 命令
	async syncToQuartz(statusBarItemEl: HTMLElement) {
		const { quartzPath, mdPath, htmlPath } = this.settings;
		statusBarItemEl.setText("⚙️ 开始构建花园...");
		
		try {
			// 构建花园
			await CommandOperations.buildGarden(quartzPath, mdPath, htmlPath);
			await CommandOperations.writeVercelJson(htmlPath);
			statusBarItemEl.setText("⌛️ 构建花园完成，等待提交...");
			
			// 打开提交信息输入对话框
			new CommitMessageModal(this.app, async (message) => {
				try {
					statusBarItemEl.setText("⌛️ 发布中...");
					if (message && message.trim()) {
						// 提交并推送到远程仓库
						await CommandOperations.commitAndPush(htmlPath, message);
						statusBarItemEl.setText("✅ 已发布");
					} else {
						// 提交并推送到远程仓库
						await CommandOperations.commitAndPush(htmlPath);
						statusBarItemEl.setText("✅ 已发布");
					}
				} catch (error) {
					console.error("提交和推送过程中出错:", error);
					statusBarItemEl.setText("❌ 发布失败");
					new Notice(`发布失败: ${error.message || '未知错误'}`);
				}
			}).open();
		} catch (error) {
			console.error("构建花园过程中出错:", error);
			statusBarItemEl.setText("❌ 构建失败");
			new Notice(`构建花园失败: ${error.message || '未知错误'}`);
		}
	}

	async syncToMd(statusBarItemEl: HTMLElement) {
		const { mdPath } = this.settings;
		statusBarItemEl.setText("⌛️ 更新源文件中...");
		
		try {
			// 同步笔记到 Markdown
			await CommandOperations.syncToMd(mdPath);
			statusBarItemEl.setText("✅ 更新源文件完成");
		} catch (error) {
			console.error("同步到Markdown过程中出错:", error);
			statusBarItemEl.setText("❌ 更新源文件失败");
		}	
	}

	checkConfig() {
		// quartzPath 为空，则提示用户输入 quartzPath
		if (this.settings.quartzPath === "" || !this.app.vault.adapter.exists(this.settings.quartzPath)) {
			new Notice("请先配置有效的 Quartz 本地路径");
			return false;
		}

		// mdPath 为空，则提示用户输入 mdPath
		if (this.settings.mdPath === "" || !this.app.vault.adapter.exists(this.settings.mdPath)) {
			new Notice("请先配置 Markdown 文件路径");
			return false;
		}

		// htmlPath 为空或不存在，则提示用户输入 htmlPath
		if (this.settings.htmlPath === "" || !this.app.vault.adapter.exists(this.settings.htmlPath)) {
			new Notice("请先配置有效的 HTML 输出路径");
			return false;
		}

		return true;
	}

	onunload() {
		console.log("禁用插件，释放资源");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class QuartzPublishSettingTab extends PluginSettingTab {
	plugin: QuartzPublishPlugin;
	
	constructor(app: App, plugin: QuartzPublishPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	
	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		
		// Quartz 本地路径设置
		new Setting(containerEl)
			.setName('Quartz 本地路径')
			.setDesc('设置 Quartz 本地路径')
			.addText(text => text
				.setPlaceholder('输入 Quartz 本地路径')
				.setValue(this.plugin.settings.quartzPath)
				.onChange(async (value) => {
					this.plugin.settings.quartzPath = value;
					await this.plugin.saveSettings();
				}));
		
		// Markdown 文件路径设置
		new Setting(containerEl)
			.setName('Markdown 文件路径')
			.setDesc('设置 Markdown 文件路径')
			.addText(text => text
				.setPlaceholder('输入 Markdown 文件路径')
				.setValue(this.plugin.settings.mdPath)
				.onChange(async (value) => {
					this.plugin.settings.mdPath = value;
					await this.plugin.saveSettings();
				}));
		
		// HTML 输出路径设置
		new Setting(containerEl)
			.setName('HTML 输出路径')
			.setDesc('设置 HTML 输出路径')
			.addText(text => text
				.setPlaceholder('输入 HTML 输出路径')
				.setValue(this.plugin.settings.htmlPath)
				.onChange(async (value) => {
					this.plugin.settings.htmlPath = value;
					await this.plugin.saveSettings();
				}));
		
		// 验证按钮
		new Setting(containerEl)
			.setName('验证配置')
			.setDesc('点击验证当前配置是否有效')
			.addButton(button => button
				.setButtonText('验证')
				.onClick(async () => {
					if (this.plugin.checkConfig()) {
						new Notice("✅ 配置有效");
					} else {
						new Notice("❌ 配置无效");
					}
				}));
	}
}

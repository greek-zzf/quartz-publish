import { App, Modal, Setting } from "obsidian";

export class CommitMessageModal extends Modal {
	message: string;
	onSubmit: (message: string) => void;

	constructor(app: App, defaultMessage: string, onSubmit: (message: string) => void) {
		super(app);
		this.message = defaultMessage;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl('h2', { text: 'Git 提交信息' });

		new Setting(contentEl)
			.setName('提交信息')
			.setDesc('输入 Git 提交信息')
			.addText(text => text
				.setValue(this.message)
				.onChange(value => {
					this.message = value;
				})
				.inputEl.focus());

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('取消')
				.onClick(() => {
					this.close();
				}))
			.addButton(btn => btn
				.setButtonText('提交')
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.message);
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
} 
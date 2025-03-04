import { exec } from "child_process";
import { Notice } from "obsidian";
import { promisify } from "util";

// 将 exec 转换为 Promise 形式
const execAsync = promisify(exec);

/**
 * Git 操作类，提供 Git 相关的操作方法
 */
export class CommandOperations {
	/**
	 * 执行 Git 命令
	 * @param command Git 命令
	 * @param cwd 工作目录
	 * @param showNotice 是否显示通知
	 * @param shell 使用的 shell，默认使用 bash
	 * @returns 命令执行结果
	 */
	private static async executeGitCommand(
		command: string,
		cwd: string,
		showNotice: boolean = false,
		shell: string = "bash" // 默认使用 bash
	): Promise<string> {
		try {
			// 根据指定的 shell 执行命令
			const shellCommand = `${shell} -c "${command.replace(
				/"/g,
				'\\"'
			)}"`;

			const { stdout } = await execAsync(shellCommand, { cwd });
			return stdout.trim();
		} catch (error) {
			if (showNotice) {
				new Notice(`命令执行失败: ${error.message}`);
			}
			throw error;
		}
	}

	/**
	 * 执行 git add 命令
	 * @param repoPath 仓库路径
	 * @param files 要添加的文件，默认为所有文件
	 */
	public static async add(repoPath: string): Promise<void> {
		await this.executeGitCommand(`git add .`, repoPath);
	}

	/**
	 * 执行 git commit 命令
	 * @param repoPath 仓库路径
	 * @param message 提交信息
	 */
	public static async commit(
		repoPath: string,
		message: string
	): Promise<void> {
		const command = `git commit -m '${message}'`;
		console.log(command);
		await this.executeGitCommand(command, repoPath);
	}

	/**
	 * 执行 git push 命令
	 * @param repoPath 仓库路径
	 * @param remote 远程仓库名称
	 * @param branch 分支名称
	 */
	public static async push(repoPath: string): Promise<void> {
		const command = `git push origin master`;
		await this.executeGitCommand(command, repoPath);
	}

	public static async pull(repoPath: string): Promise<void> {
		const command = `git pull`;
		await this.executeGitCommand(command, repoPath);
	}

	public static async buildGarden(
		quartzPath: string,
		mdPath: string,
		htmlPath: string
	): Promise<void> {
		const command = `export PATH=/Users/zhouzhaofeng/.nvm/versions/node/v20.17.0/bin:$PATH && npx quartz build -d ${mdPath} -o ${htmlPath}`;
		await this.executeGitCommand(command, quartzPath);
	}

	public static async writeVercelJson(htmlPath: string): Promise<void> {
		const vercelFile = `{
			"cleanUrls": true
		}`;
		const command = `echo '${vercelFile}' > ${htmlPath}/vercel.json`;
		await this.executeGitCommand(command, htmlPath);
	}

	public static async syncToMd(
		mdPath: string,
		commitMessage: string = `更新于 ${new Date().toLocaleString()}`
	): Promise<void> {
		// 同步笔记到 Markdown
		// 执行 git add
		await this.add(mdPath);

		// 执行 git commit
		await this.commit(mdPath, commitMessage);

		// 执行 git push
		await this.push(mdPath);
	}

	/**
	 * 执行完整的 Git 工作流：add, commit, push
	 * @param htmlPath 仓库路径
	 * @param commitMessage 提交信息，默认为当前时间
	 */
	public static async commitAndPush(
		htmlPath: string,
		commitMessage: string = `更新于 ${new Date().toLocaleString()}`
	): Promise<void> {
			// 执行 git add
			await this.add(htmlPath);

			// 执行 git commit
			await this.commit(htmlPath, commitMessage);

			// 执行 git pull
			await this.pull(htmlPath);

			// 执行 git push
			await this.push(htmlPath);
	}
}

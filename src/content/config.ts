import { defineCollection, z } from 'astro:content';
import { getCollection } from "astro:content";

// import { docsSchema } from '@astrojs/starlight/schema';

function removeDuplicates(array: string[]) {
	if (!array.length) return array;
	const lowercaseItems = array.map((str) => str.toLowerCase());
	const distinctItems = new Set(lowercaseItems);
	return Array.from(distinctItems);
}

const blog = defineCollection({
	// Type-check frontmatter using a schema
	schema: z.object({
		pin: z.boolean().optional(), //置顶
		hidden: z.boolean().optional(),
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		author: z.string().optional(),
		tags: z.array(z.string()).default([]).transform(removeDuplicates),
		categories: z.array(z.string()).default([]).transform(removeDuplicates),
	}),
});

const work = defineCollection({
	schema: z.object({
		company: z.string(),
		location: z.string(),
		position: z.string(),
		description: z.string().optional(), // 项目整体描述
		start: z.string(),
		end: z.string(),
		link: z.string().optional(),
	}),
});

export const collections = {
	blog,
	work,
};

export async function getBlogPosts() {
	const posts = await getCollection('blog', ({ data }) => !data.hidden);

	return posts.map((post) => {
		const fileName = post.id.split('/').pop(); // 提取文件名称部分
        const datePart = fileName?.split('.')[0]; // 获取日期部分
		const blog_slug = post.slug.split('/')[0];
		return {
			...post,
			blog_slug,
			fileName: datePart,
			title: post.data.title
		}
	})
}

export async function getWorkExperiences() {
	const experiences = await getCollection('work');

	return experiences
		.sort((a, b) => b.data.start.localeCompare(a.data.start))
		.map((exp) => ({
			company: exp.data.company,
			location: exp.data.location,
			position: exp.data.position,
			description: exp.data.description || '',
			start: exp.data.start,
			end: exp.data.end,
			link: exp.data.link || '',
			tasks: parseTasksFromMarkdown(exp.body || ''),
		}));
}

// 从 markdown body 解析 tasks 结构
function parseTasksFromMarkdown(body: string) {
	const tasks: any[] = [];
	const lines = body.split('\n');

	let currentTask: any = null;
	let currentSubtask: any = null;
	let currentDetails: string[] = [];
	let currentSubdetails: string[] = [];

	for (const line of lines) {
		const trimmed = line.trim();

		// ## 标题：主任务
		if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
			// 保存之前的任务
			if (currentTask) {
				if (currentSubtask) {
					currentSubtask.subdetails = currentSubdetails;
					currentTask.details.push(currentSubtask);
				}
				if (currentDetails.length > 0) {
					currentTask.details.push(...currentDetails);
				}
				tasks.push(currentTask);
			}

			// 开始新任务
			currentTask = {
				title: trimmed.replace('## ', '').trim() + ':',
				details: [],
			};
			currentSubtask = null;
			currentDetails = [];
			currentSubdetails = [];
		}
		// ### 标题：子任务
		else if (trimmed.startsWith('### ')) {
			// 保存之前的子任务
			if (currentSubtask && currentSubdetails.length > 0) {
				currentSubtask.subdetails = currentSubdetails;
				currentTask?.details.push(currentSubtask);
			}
			// 保存之前的详情
			if (currentDetails.length > 0) {
				currentTask?.details.push(...currentDetails);
			}

			// 开始新子任务
			currentSubtask = {
				subtitle: trimmed.replace('### ', '').trim() + ':',
				subdetails: [],
			};
			currentDetails = [];
			currentSubdetails = [];
		}
		// 列表项
		else if (trimmed.startsWith('- ')) {
			const detail = trimmed.replace('- ', '').trim();
			if (currentSubtask) {
				currentSubdetails.push(detail + ';');
			} else {
				currentDetails.push(detail + ';');
			}
		}
		// 普通段落文本（可能作为详情的一部分）
		else if (trimmed && !trimmed.startsWith('#') && currentTask) {
			// 如果有文本段落，也作为详情添加
			if (currentSubtask) {
				currentSubdetails.push(trimmed + ';');
			} else {
				currentDetails.push(trimmed + ';');
			}
		}
	}

	// 保存最后一个任务
	if (currentTask) {
		if (currentSubtask) {
			currentSubtask.subdetails = currentSubdetails;
			currentTask.details.push(currentSubtask);
		}
		if (currentDetails.length > 0) {
			currentTask.details.push(...currentDetails);
		}
		tasks.push(currentTask);
	}

	return tasks;
}
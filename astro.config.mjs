// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://julep-ai.github.io',
	base: '/vibesafe',
	integrations: [
		starlight({
			title: 'Vibesafe Docs',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/julep-ai/vibesafe' },
			],
			sidebar: [
				{
					label: 'Overview',
					items: [{ label: 'Welcome', slug: 'index' }],
				},
				{
					label: 'Getting Started',
					autogenerate: { directory: 'getting-started' },
				},
				{
					label: 'Core Concepts',
					autogenerate: { directory: 'core-concepts' },
				},
				{
					label: 'How-To Guides',
					autogenerate: { directory: 'how-to-guides' },
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
				{
					label: 'Operations',
					autogenerate: { directory: 'operations' },
				},
				{
					label: 'Appendices',
					autogenerate: { directory: 'appendices' },
				},
			],
		}),
	],
});

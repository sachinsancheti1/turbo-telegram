<script lang="ts">
	import type { PageData } from './$types';
	import type {
		NoImageItem,
		BrokenImageItem,
		BrokenLinksItem,
		NoLinkItem,
		MissingMetadataItem,
		MissingTexturesItem,
		SelfLinkItem,
		AttentionDoc
	} from '$lib/types/sanity';

	let { data }: { data: PageData } = $props();
	const h = $derived(data.health);
	const s = $derived(h.summary);

	const errorCount = $derived(
		s.withoutImages + s.withBrokenImageAssetReference + s.withBrokenLinkReferences + s.withLinksMissingNodeReference
	);
	const warningCount = $derived(
		s.withoutLinks + s.withMissingTextureCoordinates + s.withSelfLinks + s.missingTitle + s.missingCaption
	);
	const allClear = $derived(errorCount === 0 && warningCount === 0);

	function nodeLabel(item: { title: string | null; caption: string | null; _id: string }): string {
		return item.title ?? item.caption ?? item._id;
	}

	function shortId(id: string): string {
		return id.slice(-8);
	}
</script>

<svelte:head>
	<title>Health Check — Virtual Tour</title>
</svelte:head>

<div class="health-page">
	<header class="page-header">
		<div>
			<h1>Virtual Tour Health Check</h1>
			<p class="subtitle">Content quality diagnostics for Sanity data</p>
		</div>
		<a href="/" class="back-link">← Back to Tour</a>
	</header>

	<!-- Summary Cards -->
	<section class="summary-grid">
		<div class="stat-card stat-total">
			<span class="stat-value">{s.totalVirtualTourItems}</span>
			<span class="stat-label">Total Nodes</span>
		</div>
		<div class="stat-card {errorCount > 0 ? 'stat-error' : 'stat-ok'}">
			<span class="stat-value">{errorCount}</span>
			<span class="stat-label">Errors</span>
		</div>
		<div class="stat-card {warningCount > 0 ? 'stat-warn' : 'stat-ok'}">
			<span class="stat-value">{warningCount}</span>
			<span class="stat-label">Warnings</span>
		</div>
		<div class="stat-card {h.attentionDocs.length > 0 ? 'stat-warn' : 'stat-ok'}">
			<span class="stat-value">{h.attentionDocs.length}</span>
			<span class="stat-label">Nodes Need Attention</span>
		</div>
	</section>

	{#if allClear}
		<div class="all-clear">
			<span class="all-clear-icon">✓</span>
			<span>All nodes look healthy — no issues found.</span>
		</div>
	{/if}

	<!-- ERRORS -->
	{#if errorCount > 0}
		<h2 class="section-heading error-heading">Errors <span class="badge badge-error">{errorCount} affected nodes</span></h2>

		<!-- No Image -->
		{#if h.noImageNodes.length > 0}
			<details open class="issue-block issue-error">
				<summary class="issue-summary">
					<span class="issue-title">No Panorama Image</span>
					<span class="badge badge-error">{h.noImageNodes.length}</span>
				</summary>
				<p class="issue-desc">These nodes have no image asset assigned. The viewer cannot render them.</p>
				<table>
					<thead><tr><th>Node</th><th>ID</th><th>Links</th></tr></thead>
					<tbody>
						{#each h.noImageNodes as item (item._id)}
							<tr>
								<td>{nodeLabel(item)}</td>
								<td class="mono">{shortId(item._id)}</td>
								<td>{item.linkCount}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</details>
		{/if}

		<!-- Broken image asset references -->
		{#if h.brokenImages.length > 0}
			<details open class="issue-block issue-error">
				<summary class="issue-summary">
					<span class="issue-title">Broken Image Asset Reference</span>
					<span class="badge badge-error">{h.brokenImages.length}</span>
				</summary>
				<p class="issue-desc">These nodes reference an image asset that no longer exists in Sanity. Re-upload the image or remove the broken reference.</p>
				<table>
					<thead><tr><th>Node</th><th>ID</th><th>Dead Asset Ref</th></tr></thead>
					<tbody>
						{#each h.brokenImages as item (item._id)}
							<tr>
								<td>{nodeLabel(item)}</td>
								<td class="mono">{shortId(item._id)}</td>
								<td class="mono small">{item.imageAssetRef}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</details>
		{/if}

		<!-- Broken link node references -->
		{#if h.brokenLinks.length > 0}
			<details open class="issue-block issue-error">
				<summary class="issue-summary">
					<span class="issue-title">Broken Navigation Links</span>
					<span class="badge badge-error">{h.brokenLinks.length}</span>
				</summary>
				<p class="issue-desc">These nodes have hotspot links pointing to nodes that no longer exist. Navigation from these hotspots will fail.</p>
				{#each h.brokenLinks as item (item._id)}
					<div class="sub-item">
						<strong>{nodeLabel(item)}</strong> <span class="mono small">{shortId(item._id)}</span>
						<table>
							<thead><tr><th>Link Key</th><th>Target Ref</th><th>Target Exists</th><th>X</th><th>Y</th></tr></thead>
							<tbody>
								{#each item.badLinks as link (link._key)}
									<tr>
										<td class="mono small">{link._key}</td>
										<td class="mono small">{link.targetRef ? shortId(link.targetRef) : '—'}</td>
										<td class="{link.targetExists ? '' : 'cell-error'}">{link.targetExists ? 'Yes' : 'Missing'}</td>
										<td>{link.textureX ?? '—'}</td>
										<td>{link.textureY ?? '—'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/each}
			</details>
		{/if}
	{/if}

	<!-- WARNINGS -->
	{#if warningCount > 0}
		<h2 class="section-heading warn-heading">Warnings <span class="badge badge-warn">{warningCount} affected nodes</span></h2>

		<!-- No links -->
		{#if h.noLinkNodes.length > 0}
			<details open class="issue-block issue-warn">
				<summary class="issue-summary">
					<span class="issue-title">No Navigation Links</span>
					<span class="badge badge-warn">{h.noLinkNodes.length}</span>
				</summary>
				<p class="issue-desc">These nodes have no outgoing hotspots. Visitors will not be able to navigate away from them.</p>
				<table>
					<thead><tr><th>Node</th><th>ID</th><th>Has Image</th></tr></thead>
					<tbody>
						{#each h.noLinkNodes as item (item._id)}
							<tr>
								<td>{nodeLabel(item)}</td>
								<td class="mono">{shortId(item._id)}</td>
								<td>{item.imageRef ? 'Yes' : 'No'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</details>
		{/if}

		<!-- Missing metadata (title, caption, poseHeading, posePitch) -->
		{#if h.missingMetadata.length > 0}
			<details open class="issue-block issue-warn">
				<summary class="issue-summary">
					<span class="issue-title">Missing Metadata</span>
					<span class="badge badge-warn">{h.missingMetadata.length}</span>
				</summary>
				<p class="issue-desc">These nodes are missing title, caption, poseHeading, or posePitch. Incomplete metadata affects gallery labels and the initial view orientation.</p>
				<table>
					<thead><tr><th>Node</th><th>ID</th><th>Title</th><th>Caption</th><th>Heading</th><th>Pitch</th></tr></thead>
					<tbody>
						{#each h.missingMetadata as item (item._id)}
							<tr>
								<td>{nodeLabel(item)}</td>
								<td class="mono">{shortId(item._id)}</td>
								<td class="{item.title ? '' : 'cell-warn'}">{item.title ?? '—'}</td>
								<td class="{item.caption ? '' : 'cell-warn'}">{item.caption ?? '—'}</td>
								<td class="{item.poseHeading != null ? '' : 'cell-warn'}">{item.poseHeading ?? '—'}</td>
								<td class="{item.posePitch != null ? '' : 'cell-warn'}">{item.posePitch ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</details>
		{/if}

		<!-- Missing texture coordinates -->
		{#if h.missingTextures.length > 0}
			<details open class="issue-block issue-warn">
				<summary class="issue-summary">
					<span class="issue-title">Missing Texture Coordinates</span>
					<span class="badge badge-warn">{h.missingTextures.length}</span>
				</summary>
				<p class="issue-desc">These nodes have hotspot links without textureX or textureY. The hotspot position in the panorama will default to 0,0.</p>
				{#each h.missingTextures as item (item._id)}
					<div class="sub-item">
						<strong>{nodeLabel(item)}</strong> <span class="mono small">{shortId(item._id)}</span>
						<table>
							<thead><tr><th>Link Key</th><th>Target</th><th>textureX</th><th>textureY</th></tr></thead>
							<tbody>
								{#each item.problemLinks as link (link._key)}
									<tr>
										<td class="mono small">{link._key}</td>
										<td class="mono small">{link.targetRef ? shortId(link.targetRef) : '—'}</td>
										<td class="{link.textureX != null ? '' : 'cell-warn'}">{link.textureX ?? '—'}</td>
										<td class="{link.textureY != null ? '' : 'cell-warn'}">{link.textureY ?? '—'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/each}
			</details>
		{/if}

		<!-- Self-referencing links -->
		{#if h.selfLinks.length > 0}
			<details open class="issue-block issue-warn">
				<summary class="issue-summary">
					<span class="issue-title">Self-Referencing Links</span>
					<span class="badge badge-warn">{h.selfLinks.length}</span>
				</summary>
				<p class="issue-desc">These nodes have hotspots that link back to themselves. The viewer will reload the same node when clicked.</p>
				{#each h.selfLinks as item (item._id)}
					<div class="sub-item">
						<strong>{nodeLabel(item)}</strong> <span class="mono small">{shortId(item._id)}</span>
						<table>
							<thead><tr><th>Link Key</th><th>textureX</th><th>textureY</th></tr></thead>
							<tbody>
								{#each item.selfLinks as link (link._key)}
									<tr>
										<td class="mono small">{link._key}</td>
										<td>{link.textureX ?? '—'}</td>
										<td>{link.textureY ?? '—'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/each}
			</details>
		{/if}
	{/if}

	<!-- All attention items overview -->
	{#if h.attentionDocs.length > 0}
		<h2 class="section-heading">All Nodes Needing Attention</h2>
		<details class="issue-block issue-neutral">
			<summary class="issue-summary">
				<span class="issue-title">Combined View</span>
				<span class="badge badge-neutral">{h.attentionDocs.length}</span>
			</summary>
			<table>
				<thead>
					<tr>
						<th>Node</th>
						<th>ID</th>
						<th>Image</th>
						<th>Asset OK</th>
						<th>Links</th>
						<th>Bad Refs</th>
					</tr>
				</thead>
				<tbody>
					{#each h.attentionDocs as item (item._id)}
						<tr>
							<td>{nodeLabel(item)}</td>
							<td class="mono">{shortId(item._id)}</td>
							<td class="{item.hasImage ? '' : 'cell-error'}">{item.hasImage ? 'Yes' : 'No'}</td>
							<td class="{item.hasImage && !item.imageAssetExists ? 'cell-error' : ''}">{item.hasImage ? (item.imageAssetExists ? 'Yes' : 'Broken') : '—'}</td>
							<td class="{item.linkCount === 0 ? 'cell-warn' : ''}">{item.linkCount}</td>
							<td class="{item.badReferenceCount > 0 ? 'cell-error' : ''}">{item.badReferenceCount}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</details>
	{/if}
</div>

<style>
	.health-page {
		max-width: 960px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
		font-family: sans-serif;
		color: #1a1a1a;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		margin: 0 0 0.25rem;
		font-size: 1.75rem;
	}

	.subtitle {
		margin: 0;
		color: #666;
		font-size: 0.9rem;
	}

	.back-link {
		color: #555;
		text-decoration: none;
		font-size: 0.9rem;
		white-space: nowrap;
		padding-top: 0.25rem;
	}

	.back-link:hover { color: #000; }

	/* Summary cards */
	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 2rem;
		font-weight: 700;
		line-height: 1;
		margin-bottom: 0.35rem;
	}

	.stat-label {
		display: block;
		font-size: 0.8rem;
		color: #555;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.stat-total { background: #f5f5f5; }
	.stat-ok { background: #f0fdf4; border-color: #86efac; }
	.stat-ok .stat-value { color: #16a34a; }
	.stat-error { background: #fef2f2; border-color: #fca5a5; }
	.stat-error .stat-value { color: #dc2626; }
	.stat-warn { background: #fffbeb; border-color: #fcd34d; }
	.stat-warn .stat-value { color: #d97706; }

	/* All clear banner */
	.all-clear {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		background: #f0fdf4;
		border: 1px solid #86efac;
		border-radius: 8px;
		color: #15803d;
		font-weight: 500;
		margin-bottom: 2rem;
	}

	.all-clear-icon { font-size: 1.25rem; }

	/* Section headings */
	.section-heading {
		font-size: 1.1rem;
		margin: 2rem 0 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.error-heading { color: #b91c1c; }
	.warn-heading { color: #92400e; }

	/* Badges */
	.badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
	}

	.badge-error { background: #fee2e2; color: #b91c1c; }
	.badge-warn { background: #fef3c7; color: #92400e; }
	.badge-neutral { background: #f3f4f6; color: #374151; }

	/* Issue blocks */
	.issue-block {
		border-radius: 8px;
		border: 1px solid;
		margin-bottom: 1rem;
		overflow: hidden;
	}

	.issue-error { border-color: #fca5a5; background: #fef2f2; }
	.issue-warn { border-color: #fcd34d; background: #fffbeb; }
	.issue-neutral { border-color: #e5e7eb; background: #f9fafb; }

	.issue-summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		cursor: pointer;
		list-style: none;
		font-weight: 600;
	}

	.issue-summary::-webkit-details-marker { display: none; }
	.issue-summary::before { content: '▶'; font-size: 0.65rem; color: #888; transition: transform 0.15s; }
	details[open] > .issue-summary::before { transform: rotate(90deg); }

	.issue-title { flex: 1; }

	.issue-desc {
		margin: 0 1rem 0.75rem;
		font-size: 0.85rem;
		color: #555;
	}

	/* Tables */
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
		margin: 0 0 0.5rem;
	}

	th, td {
		text-align: left;
		padding: 0.4rem 0.75rem;
		border-bottom: 1px solid rgba(0,0,0,0.06);
	}

	th {
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #555;
		background: rgba(0,0,0,0.03);
	}

	.mono { font-family: monospace; }
	.small { font-size: 0.78rem; }

	.cell-error { color: #dc2626; font-weight: 600; }
	.cell-warn { color: #d97706; font-weight: 600; }

	/* Sub-items (per-node detail within a section) */
	.sub-item {
		padding: 0.5rem 1rem 0;
		border-top: 1px solid rgba(0,0,0,0.06);
	}

	.sub-item:first-of-type { border-top: none; }

	.sub-item strong { font-size: 0.9rem; }
</style>

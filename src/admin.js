const adminIds = process.env.ADMIN_IDS
	? process.env.ADMIN_IDS.split(",")
			.map((id) => Number(id.trim()))
			.filter((id) => !Number.isNaN(id))
	: [];

export function isAdmin(ctx) {
	return ctx.from && adminIds.includes(ctx.from.id);
}

import { DataTypes, Sequelize } from "sequelize";

export const sequelize = new Sequelize({
	dialect: "sqlite",
	storage: "data/scrajob.sqlite",
	logging: false,
});

export const ScrapedJob = sequelize.define(
	"ScrapedJob",
	{
		id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
		source: { type: DataTypes.STRING, allowNull: false },
		sourceId: { type: DataTypes.STRING, allowNull: false },
		title: { type: DataTypes.STRING, allowNull: false },
		company: { type: DataTypes.STRING, allowNull: false, defaultValue: "Unknown" },
		location: { type: DataTypes.STRING, allowNull: false, defaultValue: "Remote" },
		url: { type: DataTypes.TEXT, allowNull: false },
		description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
		datePosted: { type: DataTypes.DATE, allowNull: true },
		salaryRange: { type: DataTypes.STRING, allowNull: true },
	},
	{
		indexes: [{ unique: true, fields: ["source", "sourceId"] }],
	}
);

export const TrackedJob = sequelize.define("TrackedJob", {
	id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
	title: { type: DataTypes.STRING, allowNull: false },
	company: { type: DataTypes.STRING, allowNull: false },
	salaryRange: { type: DataTypes.STRING, allowNull: true },
	url: { type: DataTypes.TEXT, allowNull: true },
	notes: { type: DataTypes.TEXT, allowNull: true },
	dateApplied: { type: DataTypes.DATEONLY, allowNull: true },
	status: {
		type: DataTypes.ENUM("To Apply", "Applied", "Interviewing", "Offer", "Rejected"),
		allowNull: false,
		defaultValue: "To Apply",
	},
	sourceJobId: { type: DataTypes.INTEGER, allowNull: true },
});

export const Profile = sequelize.define("Profile", {
	id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
	resumeText: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
});

export async function initDatabase() {
	await sequelize.sync();
	await Profile.findOrCreate({ where: { id: 1 }, defaults: { resumeText: "" } });
}

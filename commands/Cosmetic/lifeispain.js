const { SlashCommandBuilder } = require('@discordjs/builders');

this.name = 'lifeispain';
this.description = 'Life is not okay'

module.exports = {
	name: this.name,
	description: this.description,
	type: 'Cosmetic',
	cooldown: 3,
	guildOnly: true,
	data: new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description),
	async execute(interaction) {
		return interaction.reply({ content: 'Yes', ephemeral: true });
	},
};
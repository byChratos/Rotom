const { SlashCommandBuilder } = require('@discordjs/builders');

this.name = 'beep';
this.description = 'Beep!'

module.exports = {
	name: this.name,
	description: this.description,
	type: 'Utility',
	cooldown: 3,
	guildOnly: true,
	data: new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description),
	async execute(interaction) {
		return interaction.reply({ content: 'Boop!', ephemeral: true });
	},
};
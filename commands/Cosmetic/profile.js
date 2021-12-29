const { SlashCommandBuilder } = require('@discordjs/builders');
const Canvas =  require('canvas');

this.name = 'profile';
this.description = 'Sieh dir dein Bot eigenes Profil an.'

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
        const canvas = Canvas.createCanvas(1200, 600);
        const context = canvas.getContext('2d');


		return interaction.reply({ content: 'Yes', ephemeral: true });
	},
};
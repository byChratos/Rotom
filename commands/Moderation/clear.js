const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');

this.name = 'clear';
this.description = 'Deletes a number of messages from a channel'

module.exports = {
	name: this.name,
	description: this.description,
	type: 'Moderation',
	cooldown: 3,
	guildOnly: true,
	data: new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addIntegerOption(option =>
			option.setName('amount')
				.setRequired(true)
				.setDescription('The amount of messages to delete')),
	async execute(interaction) {
		if(interaction.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)){
			const amount = interaction.options.getInteger('amount');
			if(amount <= 0){
				return interaction.reply({ content: 'The amount has to be greater than 0', ephemeral: true });
			}else{
				interaction.channel.bulkDelete(amount, true);
				return interaction.reply({ content: `I have sucessfully deleted ${amount} messages from this channel`, ephemeral: true });
			}
		}else{
			return interaction.reply({ content: 'You do not have enough permissions to do that', ephemeral: true });
		}
	},
};
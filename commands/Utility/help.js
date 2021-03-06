const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');

this.name = 'help';
this.description = 'Wenn du Hilfe bei Befehlen brauchst.'

module.exports = {
    name: this.name,
    description: this.description,
    type: 'Utility',
    cooldown: 5,
    guildOnly: false,
    data: new SlashCommandBuilder()
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption( option =>
            option.setName('command')
                .setRequired(false)
                .setDescription('Der Befehl, mit dem du Hilfe brauchst.')),
    async execute(interaction){
        const actData = [];
        const cosData = [];
        const modData = [];
        const utiData = [];
        const { commands } = interaction.client;

        const cmds = commands.map(command => command.name);
        const arg = interaction.options.getString('command');

        if (arg == null){

            for(const cmd of cmds){
                const command = interaction.client.commands.get(cmd);
                if(command.type == 'Activity'){
                    actData.push('`' + command.name + '`');
                }else if(command.type == 'Cosmetic'){
                    cosData.push('`' + command.name + '`')
                }else if(command.type == 'Moderation'){
                    modData.push('`' + command.name + '`')
                }else if(command.type == 'Utility'){
                    utiData.push('`' + command.name + '`')
                }
            }

            const helpEmbed = new MessageEmbed()
                .setColor('#51de28')
                .setTitle('Meine Befehle')
                .setAuthor('Rotom help', 'https://i.imgur.com/LAB3Ef9.png', 'https://www.youtube.com/watch?v=uyE80ebItlA')
                .addFields(
                    { name: 'Aktivität', value: actData.join('\n'), inline: true },
                    { name: 'Kosmetisch', value: cosData.join('\n'), inline: true },
                    { name: 'Moderation', value: modData.join('\n'), inline: true },
                    { name: 'Nützlichkeit', value: utiData.join('\n'), inline: true },
                )
                .setFooter('Benutze /help <Name des Befehles> um genaue Informationen über einen Befehl zu erhalten.')
                .setTimestamp()

            return interaction.reply({ embeds: [helpEmbed] });

        }else{
            if (!cmds.includes(arg)){
                return interaction.reply({ content: 'I do not know this command. Use `/help` to see all of my commands.', ephemeral: true  });
            }

            const command = interaction.client.commands.get(arg);
            const helpEmbed = new MessageEmbed()
                .setColor('#51de28')
                .setAuthor('Rotom help', 'https://i.imgur.com/LAB3Ef9.png', 'https://www.youtube.com/watch?v=uyE80ebItlA')
                .setTitle(`${command.name[0].toUpperCase() + command.name.substring(1)} help`)
                .addFields(
                    { name: 'Description', value: command.description},
                    { name: 'Category', value: command.type, inline: true },
                    { name: 'Cooldown', value: command.cooldown.toString() + "s", inline: true },
                    { name: 'Server Only', value: command.guildOnly.toString(), inline: true },
                )
                .setTimestamp()

            return interaction.reply({ embeds: [helpEmbed] })
        }
    }
}
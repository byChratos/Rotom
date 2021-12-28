const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageEmbed, Message, DiscordAPIError } = require('discord.js');
const { Sequelize, QueryTypes } = require('sequelize');

// Database
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect:  'sqlite',
    storage: 'database.db',
});

this.name = 'roles';
this.description = 'Used to create reaction roles.';
this.cmdChannel = false;

module.exports = {
	name: this.name,
	description: this.description,
	type: 'Moderation',
	cooldown: 3,
	guildOnly: true,
	data: new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
        .addSubcommand(subcommand => 
            subcommand
                .setName('create')
                .setDescription('Creates a new reaction role message.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('addrole')
                .setDescription('Allows you to add a role to a reaction role message.')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the reaction role message you want to add the role to.')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role that you should receive.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('The Emoji you have to react with in order to get the role.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('removerole')
                .setDescription('Allows you to remove a role from a reaction role message.')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the reaction role message you want to remove the role from.')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role that you shouldn\'t receive anymore.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deletes an existing reaction role message.')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The id of the message you want to delete')
                        .setRequired(true))),
    
	async execute(interaction) {
        if(interaction.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)){
            const sub = interaction.options.getSubcommand();
            
            //Create reaction role messages
            if(sub == 'create'){

                //Create new reaction role ID
                const [results, metadata] = await sequelize.query(`SELECT * FROM roles_Messages ORDER BY id DESC`, {
                    type: QueryTypes.SELECT,
                    logging: false
                });

                let newId;
                if(results.id != 0){
                    newId = results.id + 1;
                }else{
                    newId = 1;
                }

                //Create the reaction role message itself in Discord
                const reactionRoleEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('React to get your roles')
                    .setDescription('description not set')
                    .setTimestamp()
                    .setFooter(`Reaction Role ID: ${newId}`)

                let sent = await interaction.channel.send({ embeds: [reactionRoleEmbed] });
                let message_id = sent.id;

                //Create the message in the database
                await sequelize.query(`INSERT INTO roles_Messages(id, message_id) VALUES(?, ?)`,
                {
                    replacements: [newId, message_id],
                    type: QueryTypes.INSERT,
                    logging: false
                });

                return interaction.reply( { content: 'Message created', ephemeral: true } );

            //Add a role
            }else if(sub == 'addrole'){
                const id = interaction.options.getInteger('id');
                const role = interaction.options.getRole('role');
                const emoji = interaction.options.getString('emoji');

                await sequelize.query(`SELECT message_id AS message_id FROM roles_Messages WHERE id = ?`, {
                    type: QueryTypes.SELECT,
                    logging: false,
                    replacements: [id]
                }).then(result =>{
                    if(result.length == 0) return interaction.reply({ content: 'This ID does not exist '});

                    interaction.channel.messages.fetch(result[0].message_id)
                        .then(messages => {
                            if(emoji.toString().startsWith('<')){
                                const emoji_id = emoji.slice(emoji.length-19, -1);
                                messages.at(0).react(interaction.guild.emojis.cache.get(emoji_id));
                            }else{
                                messages.at(0).react(emoji);
                            }

                            let desc = messages.at(0).embeds[0].description;
                            if(desc == "description not set"){
                                desc = `${emoji} - ${role.name}`;
                            }else{
                                desc = desc + `\n${emoji} - ${role.name}`;
                            }

                            const reactionRoleEmbed = new MessageEmbed()
                                .setColor('#0099ff')
                                .setTitle('React to get your roles')
                                .setDescription(desc)
                                .setTimestamp()
                                .setFooter(`Reaction Role ID: ${id}`)
                            messages.at(0).edit({ embeds: [reactionRoleEmbed] });
                        })
                        .then(() => {
                            sequelize.query(`INSERT INTO roles_EmojiForRole(id, emoji_id, role_id) VALUES(?, ?, ?)`,
                            {
                                replacements: [id, emoji.toString(), role.id],
                                type: QueryTypes.INSERT,
                                logging: false
                            })
                        })
                        .then(() => {
                            return interaction.reply({ content: 'Role added', ephemeral: true });
                        } );
                });


            //Remove a role
            }else if(sub == 'removerole'){
                const id = interaction.options.getInteger('id');
                const role = interaction.options.getRole('role');

                await sequelize.query(`SELECT emoji_id AS emoji_id FROM roles_EmojiForRole WHERE id = ? AND role_id = ?`, {
                    type: QueryTypes.SELECT,
                    logging: false,
                    replacements: [id, role.id]
                }).then(emoji_id => {
                    if(emoji_id == 0) return;

                    const emojiId = emoji_id[0].emoji_id;
                    sequelize.query(`SELECT message_id AS message_id FROM roles_Messages WHERE id = ?`, {
                        type: QueryTypes.SELECT,
                        logging: false,
                        replacements: [id]
                    }).then(result =>{
                        if(result.length == 0) return interaction.reply({ content: 'This ID does not exist '});

                        interaction.channel.messages.fetch(result[0].message_id)
                            .then(messages => {
                                messages.at(0).reactions.cache.get(emojiId).remove()
                                    .catch(error => console.error('Failed to remove reactions:', error));
                                
                                let emoji;
                                if(emojiId.toString().startsWith('<')){
                                    emoji = interaction.guild.emojis.cache.get(emojiId);
                                }else{
                                    emoji = emojiId;
                                }

                                let desc = messages.at(0).embeds[0].description;
                                desc = desc.replace(`${emoji} - ${role.name}`, '');

                                desc = desc.replace('\n\n', '\n');

                                if(desc == '') desc = 'description not set';
                                if(desc.startsWith('\n')) desc = desc.slice(1);
                                if(desc.endsWith('\n')) desc = desc.slice(0, -2);

                                const reactionRoleEmbed = new MessageEmbed()
                                    .setColor('#0099ff')
                                    .setTitle('React to get your roles')
                                    .setDescription(desc)
                                    .setTimestamp()
                                    .setFooter(`Reaction Role ID: ${id}`)
                                messages.at(0).edit({ embeds: [reactionRoleEmbed] });
                            })
                    }).then(() => {
                        sequelize.query(`DELETE FROM roles_EmojiForRole WHERE id = ? AND role_id = ?`, {
                            type: QueryTypes.DELETE,
                            logging: false,
                            replacements: [id, role.id]
                        })
                    }).then(() => { 
                        return interaction.reply( { content: 'Role removed', ephemeral: true } );
                    });
                });

            //Delete reaction role messages
            }else if(sub == 'delete'){
                //Delete reaction role with ID
                const id = interaction.options.getInteger('id');

                await sequelize.query(`SELECT message_id AS message_id FROM roles_Messages WHERE id = ?`, {
                    type: QueryTypes.SELECT,
                    logging: false,
                    replacements: [id]
                }).then(result =>{
                    if(result.length == 0) return interaction.repy({ content: 'This ID does not exist '});

                    interaction.channel.messages.fetch(result[0].message_id)
                        .then(messages => messages.at(0).delete())
                        .then(() => {sequelize.query(`DELETE FROM roles_Messages WHERE id = ?`, {
                            type: QueryTypes.DELETE,
                            logging: false,
                            replacements: [id]
                        })} )
                        .then(() => {
                            sequelize.query(`DELETE FROM roles_EmojiForRole WHERE id = ?`, {
                                type: QueryTypes.DELETE,
                                logging: false,
                                replacements: [id]
                            })
                        })
                        .then(() => {
                            return interaction.reply( { content: 'Message deleted', ephemeral: true } );
                    });
                });
            }
        }
    }
}
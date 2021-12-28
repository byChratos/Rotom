const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { token, activity, commandChannel } = require('./config.json');
//const Sequelize = require('sequelize');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
client.cooldowns = new Collection();

const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders){

    // Get the command files
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));

    // Loads the commands from the files
    for (const file of commandFiles){
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.name, command);

    }

}
/*
// Database
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.db',
})
*/

client.once('ready', () => {
	console.log('Ready!');
	client.user.setActivity(activity);
});
client.on("warn", console.warn);
client.on("error", console.error);

client.on('interactionCreate', async interaction => {
	//Returns if interaction is not a command
	if(!interaction.isCommand()) return;

	//Returns if interaction is triggered by bot, not sure if possible lol
	if(interaction.user.bot) return;

	// Message if the command is in a wrong channel
    if (commandChannel !== "none" && interaction.channel.type !== 'dm'){
        if (commandChannel !== interaction.channel.id.toString()){
            client.channels.fetch(commandChannel)
            .then(channel => interaction.reply({ content: `Please use this channel to use commands: ${channel.toString()}`, ephemeral: true }));
            return;
        }
    }

	const command = client.commands.get(interaction.commandName);

	//Returns if command does not exist
	if(!command) return;

	// Message if command cant be used in DMs
    if (command.guildOnly && interaction.channel.type === 'dm'){
        return interaction.reply('I can\'t execute that command inside DMs!')
    }

	// Cooldowns
    const { cooldowns } = client;

    if (!cooldowns.has(command.name)){
        cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(interaction.user.id)){
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime){
            const timeLeft = (expirationTime - now) / 1000;
            return interaction.reply({ content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`, ephemeral: true })
        }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

	try{
		//Execute the command based on the interaction
		await command.execute(interaction);
	}catch(error){
		//Error is self explanatory
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});


client.login(token);
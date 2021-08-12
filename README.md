This is a bulk name checker for Minecraft. You can enter a list of names and check whether they are available.
Main features include reading in .txt files and using a minimal number of requests so you can check more names before you are timed out.

Using the Mojang bulk api 10 names can be check with one request.
Mojang allows 600 requests every 10 minutes so with this program you can check 6000 names every 10 minutes.

# Installation:
- To use this program you need to have Node.js installed. This can be done here https://nodejs.org/en/download/
at the official site or here https://phoenixnap.com/kb/install-node-js-npm-on-windows (for windows) with a guide.
- You can check whether you have it installed by opening a terminal and typing `node --version` if it returns something like `v16.4.1` then it installed correctly.
- You can now download the program. on the GitHub page click on the `Code` button in the top right and select 'Download ZIP'.
- You now need to extract the zip into a folder.
- Once you installed Node, open a terminal inside the project folder.
(This can be done by going to the folder in your file manager and right clicking. There should be an option to 'open in terminal')
- In the terminal type `npm install` (and press Enter). This will install all the dependencies needed. This might take a few minutes.
- Once the dependencies are installed type `node .` (and press Enter). This open the program in Node.
The page will automatically open in your browser and is ready to be used.
- To close the program it should be sufficient to close the browser tab.
If for some reason node continues to run in the terminal it is no problem to close the terminal or interupt the program.

# Future plans:
- I want to a feature to automatically generate names. I'll probably allow for different methods of generation because people have different preferences in names.
- I want to add an option to automatically send the next batch of names every 10 minutes so you don't have to come back every 10 minutes. The ground work for this is already in place. I basically just need to set a timer in frontend.js

# Dependencies:
- get-port 5.1.1: This is a simple way to find an open port on you computer. This is nessesary for the browser and node to communicate.
- node-fetch 2.6.1: This allows node to make the requests to the Mojang api.
- node-static 0.7.11: This is a simple static web server used to load the index.html page.
- open 8.2.1: This allows node to open the page automatically.
- websocket 1.0.34: This is also necessary for the browser and node to communicate.

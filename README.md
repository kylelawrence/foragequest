# Forage Quest

Forage Quest is a Phaser 3 proof of concept game to explore simple top down gameplay. The goal of the game is to complete simple quests by foraging the requested items from the map.

### Expected input support

-   Keyboard
-   XBox Controller
-   PS4/5 Controller
-   Switch Pro Controller

<br>

# Requirements

#### _DO NOT INSTALL THESE ON YOUR OWN ACCORD. READ THE DEVELOPMENT ENVIRONMENT SETUP INSTRUCTIONS BELOW._

<br>

### Windows

-   WSL (Windows Subsystem for Linux)

And:

### Windows and Mac

-   nodejs 16+
-   yarn 2+
-   git

<br>

# Development environment setup

## Windows

### From **administrator powershell prompt**:

-   Install and run WSL ([Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install))

        wsl --install
        wsl

-   Install git

        sudo apt-get update
        sudo apt-get upgrade
        sudo apt-get install git-all

Then:

## Windows <small>(_WSL_)</small> and Mac

-   Install nvm ([node version manager](https://github.com/nvm-sh/nvm#git-install))

        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
        source ~/.bashrc

-   Install nodejs

        nvm install node

-   Install [yarn](https://yarnpkg.com/getting-started/install) via corepack

        corepack enable
        corepack prepare yarn@stable --activate

-   Install [Visual Studio Code](https://code.visualstudio.com/)

-   Create a workspace folder in your home directory

        mkdir ~/workspace
        cd ~/workspace

-   Clone the repository

        git clone https://github.com/kylelawrence/foragequest.git
        cd foragequest

-   Run yarn to install dependencies for the project

        yarn

-   Open VS Code to the project directory

        code .

-   Install VS Code Extensions

    -   [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

-   Start the project

        yarn dev

# Learning resources

-   [Phaser 3](https://newdocs.phaser.io/docs/3.55.2)
-   [Typescript](https://www.typescriptlang.org/docs/)
-   [Vite](https://vitejs.dev/guide/)
-   [GitHub](https://skills.github.com/)

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Crée un nouvel élément de status bar
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    // statusBarItem.tooltip = "Cliquez pour gérer le minuteur";
    statusBarItem.command = "extension.manageTimer"; // Commande associée au clic
    statusBarItem.show(); // Affiche l'élément

    // Ajoutez à l'objet context pour nettoyer lors de la désactivation
    context.subscriptions.push(statusBarItem);

    // Commande pour gérer le minuteur
	let mainTimer = Date.now();
    let countdownTime = 0;
	let toDisplay = 'timer';


    const manageTimerDisposable = vscode.commands.registerCommand('extension.manageTimer', async () => {
        const options: vscode.QuickPickItem[] = [
            { label: 'Réinitialiser le compteur' },
            { label: 'Ajouter un nouveau minuteur' },
			{ label: 'Arrêter le minuteur' },
			{ label: 'Reprendre le minuteur' },
			{ label: 'Switch affichage'}
        ];
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: 'Choisissez une action'
        });

        if (!selection) {
            return;
        }

        if (selection.label === 'Réinitialiser le compteur') {
            mainTimer = Date.now();
            countdownTime = 0;
            vscode.window.showInformationMessage('Minuteur réinitialisé !');
        } else if (selection.label === 'Ajouter un nouveau minuteur') {
            const input = await vscode.window.showInputBox({
                prompt: 'Combien d\'heures souhaitez-vous ajouter ?',
                validateInput: (value) => {
                    const num = Number(value);
                    return isNaN(num) || num <= 0 ? 'Veuillez entrer un nombre valide d\'heures' : null;
                }
            });
            if (input) {
                const hours = Number(input);
                countdownTime = hours * 3600 * 1000; // Convertir les heures en millisecondes
                mainTimer = Date.now();
                vscode.window.showInformationMessage(`Minuteur défini pour ${hours} heures.`);
            }
        } else if (selection.label === 'Arrêter le minuteur') {
			if (countdownTime === 0) {
				vscode.window.showInformationMessage('Aucun minuteur en cours !');
				return;
			} else {
				countdownTime = Date.now() - mainTimer;
				vscode.window.showInformationMessage('Minuteur arrêté !');
			}
		} else if (selection.label === 'Reprendre le minuteur') {
			if (countdownTime === 0) {
				vscode.window.showInformationMessage('Aucun minuteur en cours !');
				return;
			} else {
				mainTimer = Date.now() - countdownTime;
				vscode.window.showInformationMessage('Minuteur repris !');
			}
		}
		else if (selection.label === 'Switch affichage') {
			if (toDisplay === 'remaining') {
				toDisplay = 'elapsed';
				vscode.window.showInformationMessage('Affichage du temps écoulé !');
			} else {
				toDisplay = 'remaining';
				vscode.window.showInformationMessage('Affichage du temps restant !');
			}
		}
    });

    context.subscriptions.push(manageTimerDisposable);

    function formatTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    // Surveille les modifications de la configuration
    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('sessionTimer')) {
            vscode.window.showInformationMessage("La configuration a changé, veuillez recharger l'extension pour appliquer les paramètres.");
        }
    });

	setInterval(() => {
        const elapsedTime = Date.now() - mainTimer;
        if (toDisplay === 'remaining' && countdownTime > 0) {
            const remainingTime = countdownTime - elapsedTime;
            if (remainingTime > 0) {
                statusBarItem.text = `$(clock) ${formatTime(remainingTime)}`;
            } else {
                statusBarItem.text = `$(clock) Temps écoulé !`;
				vscode.window.showInformationMessage('Le minuteur est terminé !');
            }
        } else {
            statusBarItem.text = `$(clock) ${formatTime(elapsedTime)}`;
        }
    }, 1000);
}
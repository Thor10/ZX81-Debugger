/**
 * ZX81 Debugger
 * 
 * File:			htmlview.ts
 * Description:		Webview that just shows some html.
 * Author:			Sebastien Andrivet, based on Dezog my Thomas Busse (Maziac)
 * License:			GPLv3
 * Copyrights: 		ZX81 Debugger Copyright (C) 2023 Sebastien Andrivet
 * 					DeZog Copyright (C) 2023 Maziac
 */
import * as vscode from 'vscode';
import {PackageInfo} from '../info/packageinfo';
import {TextView} from './textview';



/**
 * A Webview that just shows some html.
 * E.g. used for the flow charts and call graphs.
 */
export class HtmlView extends TextView {

	// Is set with the 'on' function. A Map with command <-> function references.
	// If a message is received from the webview the 'command' is looked up
	// and the corresponding function is called.
	protected messageHandler = new Map<string, (message: any) => void>();


	/**
	 * Sets the html code to display the text.
	 * @param body The html body code to display.
	 * @param additionalHead An optional string added to the head-section.
	 * E.g. a style or script.
	 * E.g. 'a { text-decoration: none; }'
	 */
	protected setHtml(body: string, additionalHead: string) {
		// Get local path extension to set as root (to allow accessing other files)
		const extPath = PackageInfo.extension.extensionPath;
		const resourcePath = vscode.Uri.file(extPath);
		const vscodeResPath = this.vscodePanel.webview.asWebviewUri(resourcePath).toString();

		//		<base href="${vscodeResPath}/" >
		// Create html
		const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<base href="${vscodeResPath}/">
    ${additionalHead}
</head>

<script>
	const vscode = acquireVsCodeApi();

	document.addEventListener('click', event => {
		let node = event && event.target;
		while (node) {
			if (node.href) {
				let data = node.href;
				// Check if SVG link
				if(data.baseVal)
					data = data.baseVal;
				// Handle click here by posting data back to VS Code
				vscode.postMessage({
					command: 'click',
					data
				});
				event.preventDefault();
				return;
			}
			node = node.parentNode;
		}
	}, true);

    //# sourceURL=HtmlView.js
</script>

<body>
${body}
</body>
</html>
`;

		// Add html body
		this.vscodePanel.webview.html = html;
	}


	/**
	 * The received events send to the callback.
	 * @param message The message. message.command contains the command as a string. message.data contains additional data (dependent on the command)
	 * The only command created by the HtlmView is 'clicked' if a node with a 'href' attribute
	 * has been clicked.
	 * 'message.data' contains the contents of the 'href'.
	 */
	protected async webViewMessageReceived(message: any) {
		const command = message.command;
		const func = this.messageHandler.get(command);
		if (func)
			func(message);
	}


	/**
	 * Works very much like the Emitter function 'on'.
	 * It registers a function that is invoked when the command
	 * string is received from the webview.
	 * @param command E.g. 'clicked'.
	 * @param func The function to call. The function is called with 'message'
	 * as parameter. The data can be obtained from message.data.
	 * If undefined the registration is cleared.
	 */
	public on(command: string, func?: (message: any) => void) {
		if (func)
			this.messageHandler.set(command, func);
		else
			this.messageHandler.delete(command);
	}
}

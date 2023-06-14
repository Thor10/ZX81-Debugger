/**
 * ZX81 Debugger
 * 
 * File:			textview.ts
 * Description:		A Webview that just shows some static text.
 * Author:			Sebastien Andrivet, based on Dezog my Thomas Busse (Maziac)
 * License:			GPLv3
 * Copyrights: 		ZX81 Debugger Copyright (C) 2023 Sebastien Andrivet
 * 					DeZog Copyright (C) 2023 Maziac
 */
import {BaseView} from './baseview';
import {Utility} from '../misc/utility';



/**
 * A Webview that just shows some static text.
 * Is e.g. used to run an Emulator command and display it's output.
 */
export class TextView extends BaseView {
	/**
	 * Creates the text view.
	 * @param title The title to use for this view.
	 * @param html The html to show.
	 * @param headStyle An optional style that is added to the head section.
	 * E.g. 'a { text-decoration: none; }'
	 */
	constructor(title: string, html: string, headStyle: string = '') {
		super();
		// Title
		Utility.assert(this.vscodePanel);
		this.vscodePanel.title = title;
		// Use the text
		this.setHtml(html, headStyle);
	}


	/**
	 * Sets the html code to display the text.
	 * @param text Text to display.
	 * @param headStyle An optional style that is added to the head section.
	 * E.g. 'a { text-decoration: none; }'
	 */
	protected setHtml(text: string, headStyle: string) {
		const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Dump</title>
    <style>
		${headStyle}
    </style>
</head>

<body>

<pre>
${text}
</pre>

</body>
</html>
`;
		// Add html body
		this.vscodePanel.webview.html = html;
	}
}


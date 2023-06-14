/**
 * ZX81 Debugger
 * 
 * File:			reflist.ts
 * Description:		Associating IDs with objects.
 * Author:			Sebastien Andrivet, based on Dezog my Thomas Busse (Maziac)
 * License:			GPLv3
 * Copyrights: 		ZX81 Debugger Copyright (C) 2023 Sebastien Andrivet
 * 					DeZog Copyright (C) 2023 Maziac
 */
import {Log} from '../log';


/**
 * Class for associating IDs with objects.
 * Note:
 * Use of length is unreliable as the list may contain also undefined items.
 * This happens when entries are removed.
 */
export class RefList<type> extends Array<type> {

	/**
	 * Adds an object to the list and returns it's index.
	 * Use this instead of a simple push if you need to get the reference id to the object.
	 * If you don't need the id you can use push or unshift.
	 * @param obj The object to add.
	 * @returns The index of the object in the list. I.e. a unique reference number (!=0) to the object. Or if obj is undefined it returns 0.
	 */
	public addObject(obj: any): number {
		if (obj == undefined)
			return 0;
		// New entry
		this.push(obj);
		const id = this.length;
		return id;
	}


	/**
	 * Returns the corresponding object for a given reference.
	 * @param ref The reference to the object.
	 * @returns The object or undefined if not found.
	 */
	public getObject(ref: number): any {
		if (ref <= 0 || ref > this.length) {
			Log.log('RefList Error: reference ' + ref + ' not found!');
			return undefined;
		}
		const obj = this[ref - 1];
		return obj;
	}
	

	/**
	 * @returns The first element of the array. undefined if array is empty.
	 */
	public first(): any {
		if (this.length == 0)
			return undefined;
		return this[0];
	}


	/**
	 * @returns The last element of the array. undefined if array is empty.
	 */
	public last(): any {
		if (this.length == 0)
			return undefined;
		return this[this.length-1];
	}


	/**
	 * Removes all variables.
	 */
	public clear() {
		this.length = 0;
	}

}

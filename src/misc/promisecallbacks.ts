/**
 * ZX81 Debugger
 * 
 * File:			promisecallbacks.ts
 * Description:		Holds the resolve and reject callback.
 * Author:			Sebastien Andrivet, based on Dezog my Thomas Busse (Maziac)
 * License:			GPLv3
 * Copyrights: 		ZX81 Debugger Copyright (C) 2023 Sebastien Andrivet
 * 					DeZog Copyright (C) 2023 Maziac
 */


/**
 * Holds the resolve and reject callback.
 * On creation these are assigned to a property of an object.
 * If one of 'reject' or 'resolve' is called the property of the object
 * is automatically set to undefined.
 */
export class PromiseCallbacks<T> {

	// Call this to resolve.
	public resolve: (elem: T) => void;

	// Call this for failure.
	public reject: ((error: Error) => void);

	// The object and property to assign 'this' to.
	// I.e. obj[property] = this;
	protected obj: Object;
	protected property: string;


	/**
	 * Constructor.
	 * Saves the callbacks of a promise.
	 * Example call:
	 * ~~~
	 * new Promise<DebugSessionClass>((resolve, reject) => {
	 *   new PromiseCallbacks<DebugSessionClass>(this, 'unitTestsStartCallbacks', resolve, reject);
	 * });
	 * ~~~
	 * Will assign the new PromiseCallbacks to this.unitTestsStartCallbacks.
	 * @param obj The object of the property.
	 * @param property The obj.property as string.
	 * @param resolve The resolve callback.
	 * @param reject (optional) The reject callback.
	 */
	constructor(obj: Object, property: string, resolve: (elem: T) => void, reject?: (error: Error) => void) {
		this.resolve = (elem: T) => {
			resolve(elem);
			this.obj[this.property] = undefined;
		}
		if (reject) {
			this.reject = (error: Error) => {
				reject(error);
				this.obj[this.property] = undefined;
			}
		}
		this.obj = obj;
		this.property = property;
		obj[property] = this;
	}
}

/**
 * ZX81 Debugger
 * 
 * File:			z80registers.ts
 * Description:		Deal with the Z80 registers.
 * Author:			Sebastien Andrivet, based on Dezog my Thomas Busse (Maziac)
 * License:			GPLv3
 * Copyrights: 		ZX81 Debugger Copyright (C) 2023 Sebastien Andrivet
 * 					DeZog Copyright (C) 2023 Maziac
 */
import {Utility} from '../misc/utility';
import {Settings} from '../settings/settings';
import {DecodeRegisterData, RegisterData} from './decoderegisterdata';


/// The formatting (for VARIABLES) for each register is provided through a map.
export let Z80RegisterVarFormat: Map<string, string>;

/// The formatting (for hovering) for each register is provided through a map.
export let Z80RegisterHoverFormat: Map<string, string>;


/// Enums for all Z80 Registers.
export enum Z80_REG {
	PC, SP,
	AF, BC, DE, HL,
	IX, IY,
	AF2, BC2, DE2, HL2, IR,
	IM,

	F, A, C, B, E, D, L, H,
	IXL, IXH, IYL, IYH,
	F2, A2, C2, B2, E2, D2, L2, H2,
	R, I,
}



/**
 * Class to deal with the Z80 registers.
 * Note: the Z80Registers class and derivations are supposed
 * not to communicate via sockets directly.
 * I.e. there is no asynchronicity in these methods.
 *
 * For each Remote (Emulator) a derivation of this class is required
 * to parse the data received from the remote for the registers.
 * The derived class normally needs to implement the methods:
 * - parsePC/SP/AF/BC/...AF2/BC2/HL2/DE2, i.e. the 2 byte (word) registers
 * - parseI, parseR
 * I.e. the other 1 byte register parse methods might be implemented as
 * well but it is not necessary as the default implementation will normally
 * work fine.
 *
 * Embedding it in the registers significantly simplifies the design.
 * As these values need to be updated the same time. The values are
 * also required at the same time to correctly calculate the long addresses.
 * I.e. the cache data can also be stored into the history easily.
 */
export class Z80RegistersClass {

	// F flag constants for bit comparison.
	public static FLAG_S = 1 << 7;
	public static FLAG_Z = 1 << 6;
	public static FLAG_H = 1 << 4;
	public static FLAG_PV = 1 << 2;
	public static FLAG_N = 1 << 1;
	public static FLAG_C = 1 << 0;


	// The names of all registers. Same order as enums.
	protected static registerNames: Array<string>;

	/// The register cache for values retrieved from ZEsarUX.
	/// Is a simple string that needs to get parsed.
	protected RegisterCache: RegisterData;

	/**
	 * Called during the launchRequest to create the singleton.
	 */
	public static createRegisters() {
		Z80Registers = new Z80RegistersClass();
		// Init the registers
		Z80RegistersClass.Init();  // Needs to be done here to honor the formatting in the Settings.
	}


	/**
	 * Sets/gets the decoder with the knowledge to decode
	 * the RegisterData.
	 */
	private _decoder: DecodeRegisterData;
	public get decoder(): DecodeRegisterData {return this._decoder}
	public set decoder(value: DecodeRegisterData) {this._decoder = value;}


	/**
	 * Constructor.
	 */
	constructor() {
		//
	}


	/**
	 * Called during the launchRequest.
	 */
	public static Init() {
		// Fill array with register names
		const names = Object.values(Z80_REG);
		this.registerNames = new Array<string>();
		for (let name of names) {
			if (typeof name != 'string')
				break;
			name = name.replace('2', "'");	// for the shadow registers
			this.registerNames.push(name);
		}

		// Formatting
		Z80RegisterVarFormat = Z80RegistersClass.createFormattingMap(Settings.launch.formatting.registerVar);
		Z80RegisterHoverFormat = Z80RegistersClass.createFormattingMap(Settings.launch.formatting.registerHover);
	}


	/**
	 * Creates a RegisterData object from the given registers.
	 */
	public static getRegisterData(PC: number, SP: number,
		AF: number, BC: number, DE: number, HL: number,
		IX: number, IY: number,
		AF2: number, BC2: number, DE2: number, HL2: number,
		I: number, R: number,
		IM: number): Uint16Array {
		// Store data in word array to save space
		const regData = new Uint16Array(Z80_REG.IM + 1);
		regData[Z80_REG.PC] = PC;
		regData[Z80_REG.SP] = SP;
		regData[Z80_REG.AF] = AF;
		regData[Z80_REG.BC] = BC;
		regData[Z80_REG.DE] = DE;
		regData[Z80_REG.HL] = HL;
		regData[Z80_REG.IX] = IX;
		regData[Z80_REG.IY] = IY;
		regData[Z80_REG.AF2] = AF2;
		regData[Z80_REG.BC2] = BC2;
		regData[Z80_REG.DE2] = DE2;
		regData[Z80_REG.HL2] = HL2;
		regData[Z80_REG.IR] = (I << 8) | R;
		regData[Z80_REG.IM] = IM;
		return regData;
	}


	/**
	 * Creates a map out of the given formatting.
	 * @param settingsMap hover or variable map from the settings.
	 * @returns A map that consists of a formatting for every register.
	 */
	private static createFormattingMap(settingsMap: any): any {
		const formattingMap = new Map();

		// Read all formatting settings
		for (let i = 0; i < settingsMap.length; i += 2) {
			let regRegex = new RegExp('^' + settingsMap[i] + '$');
			let regFormat = settingsMap[i + 1];
			// check for which registers the format should be used
			for (let regName of Z80RegistersClass.registerNames) {
				// get format
				const format = formattingMap.get(regName);
				if (format != undefined)
					continue;	// has already a format string
				// now check if register is met
				let keyWo = regName;
				let rLen = keyWo.length;
				if (keyWo[rLen - 1] == '\'')
					keyWo = keyWo.substring(0, rLen - 1);	// Remove the "'" in the register name
				const match = regRegex.exec(keyWo);
				if (match == undefined)
					continue;	// no match
				// use the format string  for this register
				formattingMap.set(regName, regFormat);
			}
		}

		// All unset registers get a default formatting
		for (let regName of Z80RegistersClass.registerNames) {
			// get format
			const format = formattingMap.get(regName);
			if (format != undefined)
				continue;	// has already a format string
			// set default format
			let rLen;
			if (regName == "IXH" || regName == "IXL" || regName == "IYH" || regName == "IYL" || regName == "IM") {
				// Value length = 1 byte
				rLen = 1;
			}
			else {
				rLen = regName.length;
				if (regName[rLen - 1] == '\'') --rLen;	// Don't count the "'" in the register name
			}
			if (rLen == 1)
				formattingMap.set(regName, '${hex}h, ${unsigned}u');
			else
				formattingMap.set(regName, '${hex}h, ${unsigned}u${, :labelsplus|, }');
		}

		// return
		return formattingMap;
	}


	/**
	 * Returns the register enum value for a register string.
	 * @param reg E.g. "HL" (case insensitive)
	 * @returns E.g. Z80_REG.HL
	 */
	public static getEnumFromName(reg: string): Z80_REG | undefined {
		const regUpper = reg.toUpperCase();
		const index = Z80RegistersClass.registerNames.indexOf(regUpper);
		if (index < 0)
			return undefined;
		return index;
	}


	/**
	 * Returns true if the string contains a register.
	 * @param reg To check for a register name.
	 */
	public static isRegister(reg: string): boolean {
		return (Z80RegistersClass.getEnumFromName(reg) != undefined);
	}


	/**
	 * Returns true if the string contains a single register,
	 * e.g. A, B, C, D, E, H, L.
	 * @param reg To check for a register name.
	 */
	public static isSingleRegister(reg: string): boolean {
		const regEnum = Z80RegistersClass.getEnumFromName(reg)
		if (regEnum == undefined)
			return false;
		if (regEnum >= Z80_REG.F)
			return true;
		return false;
	}


	/**
	 * Check if the cc condition is met by the flags.
	 * @param cc E.g. 010b for "NC" (as in "CALL NC,nnnn")
	 * @param flags E.g. 00000001b, C is set. Only the lower byte is important.
	 * @returns false, NC is not met.
	 */
	public static isCcMetByFlag(cc: number, flags: number): boolean {
		const testSet = ((cc & 0x01) != 0);
		let condTest;
		cc = (cc >>> 1) & 0x03;
		switch (cc) {
			case 0:	// NZ, Z
				condTest = ((flags & Z80RegistersClass.FLAG_Z) != 0);
				break;
			case 1:	// NC, C
				condTest = ((flags & Z80RegistersClass.FLAG_C) != 0);
				break;
			case 2:	// PO, PE
				condTest = ((flags & Z80RegistersClass.FLAG_PV) != 0);
				break;
			case 3:	// P, M
				condTest = ((flags & Z80RegistersClass.FLAG_S) != 0);
				break;
			default:
				Utility.assert(false);	// Impossible.
		}

		const ccIsTrue = (condTest == testSet);
		return ccIsTrue;
	}


	/**
	 * Clears the register cache.
	 */
	/*
	public clearCache() {
		Log.log('Z80Registers.clearCache');
		this.RegisterCache=undefined;
	}
	*/

	/**
	 * Sets the register cache.
	 * Used by ZesaruxEmulator.getRegistersFromEmulator and the cpu history.
	 */
	public setCache(data: RegisterData) {
		this.RegisterCache = data;
	}


	/**
	 * Returns the register cache.
	 * Used by the cpu history.
	 */
	public getCache(): RegisterData {
		return this.RegisterCache;
	}


	/**
	 * Returns true if the register is available.
	 */
	public valid(): boolean {
		return this.RegisterCache != undefined;
	}


	/**
	 * Returns the formatted register value.
	 * @param regIn The name of the register, e.g. "A" or "BC"
	 * @param formatMap The map with the formats (hover map or variables map)
	 * @returns The formatted string.
	 */
	protected getFormattedReg(regIn: string, formatMap: any): string {
		// Every register has a formatting otherwise it's not a valid register name
		const reg = regIn.toUpperCase();
		const format = formatMap.get(reg);
		Utility.assert(format != undefined, 'Register ' + reg + ' does not exist.');


		// Get value of register
		const value = this.decoder.getRegValueByName(reg, this.RegisterCache);

		// Return "?" if value cannot be decoded (obtained) from remote
		if (isNaN(value))
			return "?";

		// do the formatting
		let rLen = reg.length;
		if (reg[rLen - 1] == '\'') --rLen;	// Don't count the "'" in the register name
		if (rLen == 3)
			rLen = 1;	// This is IXH, IXL, IYH, IYL

		Utility.assert(this.valid());
		const res = Utility.numberFormattedSync(value, rLen, format, false, reg);
		return res;
	}


	/**
	 * Returns the 'variable' formatted register value.
	 * @param reg The name of the register, e.g. "A" or "BC"
	 * @returns The formatted string.
	 */
	public getVarFormattedReg(reg: string): string {
		return this.getFormattedReg(reg, Z80RegisterVarFormat);
	}


	/**
	 * Returns the register value as a number.
	 * @param regName E.g. "BC".
	 * @returns The value of the register or NaN if register cannot be
	 * obtained from remote.
	 */
	public getRegValueByName(regName: string): number {
		return this.decoder.getRegValueByName(regName, this.RegisterCache);
	}


	/**
	 * Returns the register value as a number.
	 * @param reg The register enum.
	 * @returns The value of the register or NaN if register cannot be
	 * obtained from remote.
	 */
	public getRegValue(reg: Z80_REG): number {
		const name = Z80RegistersClass.registerNames[reg];
		return this.decoder.getRegValueByName(name, this.RegisterCache);
	}


	/**
	 * @returns The value of the Program Counter
	 */
	public getPC(): number {
		return this.getRegValue(Z80_REG.PC);
	}


	/**
	 * @returns The value of the Stack Pointer
	 */
	public getSP(): number {
		return this.getRegValue(Z80_REG.SP);
	}
}

export let Z80Registers: Z80RegistersClass;

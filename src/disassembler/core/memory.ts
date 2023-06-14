/**
 * ZX81 Debugger
 * 
 * File:			memory.ts
 * Description:		Simulated memory
 * Author:			Sebastien Andrivet, based on Dezog my Thomas Busse (Maziac)
 * License:			GPLv3
 * Copyrights: 		ZX81 Debugger Copyright (C) 2023 Sebastien Andrivet
 * 					DeZog Copyright (C) 2023 Maziac
 */
import {readFileSync} from 'fs';
import {BaseMemory, MAX_MEM_SIZE} from './basememory';



/// Classification of memory addresses.
export enum MemAttribute {
	/// Unassigned memory
	UNUSED = 0,
	/// Unknown area (code or data)
	ASSIGNED = 0x01,
	/// Code area
	CODE = 0x02,
	/// First byte of an opcode
	CODE_FIRST = 0x04,
	/// It is a stop code, e.g. a 'RET' or an unconditional 'JP nn'.
	/// All bytes of an opcode will get this attribute.
	//CODE_STOP = 0x08,
	/// Data area
	DATA = 0x10,
	/// A RET(I) has been found at the end of the flow for that address.
	RET_ANALYZED = 0x20,

	/// Indicates if flow has been already analyzed,
	/// Set/read only by createNodes/createNodeForAddress().
	FLOW_ANALYZED = 0x40,
}


/**
 * Class to hold and access the memory.
 */
export class Memory extends BaseMemory {

	/// An attribute field for the memory.
	protected memoryAttr = new Array<MemAttribute>(MAX_MEM_SIZE);


	/**
	 * Constructor: Initializes memory.
	 */
	constructor() {
		super(0, MAX_MEM_SIZE);
		// Init memory
		// this.memory.fill(0); // Not necessary is anyhow 0
		//this.clearAttributes(); Not required, is anyhow 0 = MemAttribute.UNUSED
	}


	/**
	 * Clears all attributes to 0.
	 */
	public clearAttributes() {
		this.memoryAttr.fill(MemAttribute.UNUSED);
	}


	/**
	 * Resets a single flag or flags in the whole memoryAttr array.
	 * @param flags The flag or flags to reset.
	 */
	public resetAttributeFlag(flags: MemAttribute) {
		const notFlags = ~flags;
		for (let k = this.memoryAttr.length; k >= 0; k--) {
			this.memoryAttr[k] &= notFlags;
		}
	}


	/**
	 * Define the memory area to disassemble.
	 * @param origin The start address of the memory area.
	 * @param memory The memory area.
	 */
	public setMemory(origin: number, memory: Uint8Array) {
		const size = memory.length;
		for (let i = 0; i < size; i++) {
			const addr = (origin + i) & (MAX_MEM_SIZE - 1);
			this.memory[addr] = memory[i];
			this.memoryAttr[addr] |= MemAttribute.ASSIGNED;
		}
	}


	/**
	 * Reads a memory area as binary from a file.
	 * @param origin The start address of the memory area.
	 * @param path The file path to a binary file.
	 */
	public readBinFile(origin: number, path: string) {
		let bin = readFileSync(path);
		this.setMemory(origin, bin);
	}


	/**
	 * Return memory attribute.
	 * @param address At address
	 * @returns The memory attribute.
	 */
	public getAttributeAt(address: number): MemAttribute {
		if (address < 0 || address >= 0x10000)
			return 0;	// Unassigned
		const attr = this.memoryAttr[address];
		return attr;
	}


	/**
	 * Adds (ORs) a **single** memory attribute for an address range.
	 * Is used to enhance performance a little bit if just a single address need to be changed.
	 * @param address The memory address
	 * @param attr The attribute to set (e.g. CODE or DATA)
	 */
	public addAttributeAt(address: number, attr: MemAttribute) {
		this.memoryAttr[address] |= attr;
	}

	/**
	 * Adds (ORs) a memory attribute for an address range.
	 * @param address The memory address
	 * @param length The size of the memory area to change.
	 * @param attr The attribute to set (e.g. CODE or DATA)
	 */
	public addAttributesAt(address: number, length: number, attr: MemAttribute) {
		for (let i = 0; i < length; i++)
			this.memoryAttr[address++] |= attr;
	}

	/**
	 * Sets a memory attribute for an address range.
	 * @param address The memory address
	 * @param length The size of the memory area to change.
	 * @param attr The attribute to set (e.g. CODE or DATA)
	 */
	public setAttributesAt(address: number, length: number, attr: MemAttribute) {
		for (let i = 0; i < length; i++)
			this.memoryAttr[address++] = attr;
	}


	/** Returns the address in a range that has the given attribute set.
	 * If attribute is not found, undefined is returned
	 * @param addr64k The start address.
	 * @param len The number of bytes to check.
	 * @return The first address with attribute set or undefined.
	 */
	public searchAddrWithAttribute(searchAttr: MemAttribute, addr64k: number, len: number): number | undefined {
		for (let i = 0; i < len; i++) {
			const attr = this.memoryAttr[addr64k];
			if (attr & searchAttr)
				return addr64k;
			// Next
			addr64k++;
		}
		// Nothing found
		return undefined;
	}
}

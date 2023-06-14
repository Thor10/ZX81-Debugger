/**
 * ZX81 Debugger
 * 
 * File:			opcode.ts
 * Description:		Abstraction of processor opcodes
 * Author:			Sebastien Andrivet, based on Dezog my Thomas Busse (Maziac)
 * License:			GPLv3
 * Copyrights: 		ZX81 Debugger Copyright (C) 2023 Sebastien Andrivet
 * 					DeZog Copyright (C) 2023 Maziac
 */
import * as util from 'util';
import {strict as assert} from 'assert';
import {BaseMemory} from './basememory';
import {NumberType} from './numbertype'
import {Format} from './format';


/// Classifies opcodes.
export enum OpcodeFlag {
	NONE = 0,
	BRANCH_ADDRESS = 0x01,	///< contains a branch address, e.g. jp, jp cc, jr, jr cc, call, call cc.
	CALL = 0x02,	///< is a subroutine call, e.g. call, call cc or rst
	STOP = 0x04,	///< is a stop-code. E.g. ret, reti, jp or jr. Disassembly procedure stops here.
	RET = 0x08,		///< is a RETURN from a subroutine (RET, RET cc)
	CONDITIONAL = 0x10,	///< is a conditional opcode, e.g. JP NZ, RET Z, CALL P etc.
}


/**
 * Class for Opcodes.
 * Contains the name, formatting, type and possibly a value.
 */
export class Opcode {
	/// The static member that holds the label converter handler.
	protected static convertToLabelHandler: (value: number) => string;

	/// The code (byte value) of the opcode
	public code: number;	/// Used to test if all codes are in the right place.

	/// The name of the opcode, e.g. "LD A,#n"
	public name: string;
	/// Opcode flags: branch-address, call, stop
	public flags: OpcodeFlag;
	/// The additional value in the opcode, e.g. nn or n
	public valueType: NumberType;
	/// The length of the opcode + value
	public length: number;

	/// The value (if any) used in the opcode, e.g. nn in "LD HL,nn"
	/// Is set when decoded for the current instruction.
	public value: number;

	// The disassembled text of the opcode. E.g. "LD A,(DATA_LBL0400)".
	public disassembledText: string;

	// An associated address. Not really used, is more a debug feature.
	public addr64k: number;


	/// Call this to use lower case or upper case opcodes.
	public static makeLowerCase() {
		for (const oc of Opcode.Opcodes)
			oc.name = oc.name.toLowerCase();
		for (const oc of Opcode.OpcodesCB)
			oc.name = oc.name.toLowerCase();
		for (const oc of Opcode.OpcodesDD)
			oc.name = oc.name.toLowerCase();
		for (const oc of Opcode.OpcodesED)
			oc.name = oc.name.toLowerCase();
		for (const oc of Opcode.OpcodesFD)
			oc.name = oc.name.toLowerCase();
		for (const oc of Opcode.OpcodesDDCB)
			oc.name = oc.name.toLowerCase();
		for (const oc of Opcode.OpcodesFDCB)
			oc.name = oc.name.toLowerCase();
	}


	public static Opcodes: Opcode[];
	public static OpcodesED: Opcode[];
	public static OpcodesCB: Opcode[];
	public static OpcodesFD: Opcode[];
	public static OpcodesDD: Opcode[];
	public static OpcodesDDCB: Opcode[];
	public static OpcodesFDCB: Opcode[];

	/**
	 * Initializes all opcodes.
	 */
	public static InitOpcodes() {
		/// Opcodes that start with 0xED.
		Opcode.OpcodesED = [
			...Array<number>(0x40).fill(0).map((_value, index) => new OpcodeInvalid(index)),

			new Opcode(0x40, "IN B,(C)"),
			new Opcode(0x41, "OUT (C),B"),
			new Opcode(0x42, "SBC HL,BC"),
			new Opcode(0x43, "LD (#nn),BC"),
			new Opcode(0x44, "NEG"),
			new Opcode(0x45, "RETN"),
			new Opcode(0x46, "IM 0"),
			new Opcode(0x47, "LD I,A"),
			new Opcode(0x48, "IN C,(C)"),
			new Opcode(0x49, "OUT (C),C"),
			new Opcode(0x4A, "ADC HL,BC"),
			new Opcode(0x4B, "LD BC,(#nn)"),
			new Opcode(0x4C, "[neg]"),
			new Opcode(0x4D, "RETI"),
			new Opcode(0x4E, "[im0]"),
			new Opcode(0x4F, "LD R,A"),
			new Opcode(0x50, "IN D,(C)"),
			new Opcode(0x51, "OUT (C),D"),
			new Opcode(0x52, "SBC HL,DE"),
			new Opcode(0x53, "LD (#nn),DE"),
			new Opcode(0x54, "[neg]"),
			new Opcode(0x55, "[retn]"),
			new Opcode(0x56, "IM 1"),
			new Opcode(0x57, "LD A,I"),
			new Opcode(0x58, "IN E,(C)"),
			new Opcode(0x59, "OUT (C),E"),
			new Opcode(0x5A, "ADC HL,DE"),
			new Opcode(0x5B, "LD DE,(#nn)"),
			new Opcode(0x5C, "[neg]"),
			new Opcode(0x5D, "[reti]"),
			new Opcode(0x5E, "IM 2"),
			new Opcode(0x5F, "LD A,R"),
			new Opcode(0x60, "IN H,(C)"),
			new Opcode(0x61, "OUT (C),H"),
			new Opcode(0x62, "SBC HL,HL"),
			new Opcode(0x63, "LD (#nn),HL"),
			new Opcode(0x64, "[neg]"),
			new Opcode(0x65, "[retn]"),
			new Opcode(0x66, "[im0]"),
			new Opcode(0x67, "RRD"),
			new Opcode(0x68, "IN L,(C)"),
			new Opcode(0x69, "OUT (C),L"),
			new Opcode(0x6A, "ADC HL,HL"),
			new Opcode(0x6B, "LD HL,(#nn)"),
			new Opcode(0x6C, "[neg]"),
			new Opcode(0x6D, "[reti]"),
			new Opcode(0x6E, "[im0]"),
			new Opcode(0x6F, "RLD"),
			new Opcode(0x70, "IN F,(C)"),
			new Opcode(0x71, "OUT (C),0"),
			new Opcode(0x72, "SBC HL,SP"),
			new Opcode(0x73, "LD (#nn),SP"),
			new Opcode(0x74, "[neg]"),
			new Opcode(0x75, "[retn]"),
			new Opcode(0x76, "[im1]"),
			new Opcode(0x77, "[ld i,i?]"),
			new Opcode(0x78, "IN A,(C)"),
			new Opcode(0x79, "OUT (C),A"),
			new Opcode(0x7A, "ADC HL,SP"),
			new Opcode(0x7B, "LD SP,(#nn)"),
			new Opcode(0x7C, "[neg]"),
			new Opcode(0x7D, "[reti]"),
			new Opcode(0x7E, "[im2]"),
			new Opcode(0x7F, "[ld r,r?]"),
			
			...Array<number>(0x20).fill(0).map((_value, index) => new OpcodeInvalid(0x80 + index)),

			new Opcode(0xA0, "LDI"),
			new Opcode(0xA1, "CPI"),
			new Opcode(0xA2, "INI"),
			new Opcode(0xA3, "OUTI"),

			...Array<number>(0x04).fill(0).map((_value, index) => new OpcodeInvalid(0xA4 + index)),

			new Opcode(0xA8, "LDD"),
			new Opcode(0xA9, "CPD"),
			new Opcode(0xAA, "IND"),
			new Opcode(0xAB, "OUTD"),

			...Array<number>(0x04).fill(0).map((_value, index) => new OpcodeInvalid(0xAC + index)),

			new Opcode(0xB0, "LDIR"),
			new Opcode(0xB1, "CPIR"),
			new Opcode(0xB2, "INIR"),
			new Opcode(0xB3, "OUTIR"),

			...Array<number>(0x04).fill(0).map((_value, index) => new OpcodeInvalid(0xB4 + index)),

			new Opcode(0xB8, "LDDR"),
			new Opcode(0xB9, "CPDR"),
			new Opcode(0xBA, "INDR"),
			new Opcode(0xBB, "OUTDR"),

			...Array<number>(0x04).fill(0).map((_value, index) => new OpcodeInvalid(0xBC + index)),
			...Array<number>(0x40).fill(0).map((_value, index) => new OpcodeInvalid(0xC0 + index))
		];
		// Fix length (2)
		Opcode.OpcodesED.forEach(opcode => {
			opcode.length++;
		});

		/// Opcodes that start with 0xCB.
		Opcode.OpcodesCB = [
			new Opcode(0x00, "RLC B"),
			new Opcode(0x01, "RLC C"),
			new Opcode(0x02, "RLC D"),
			new Opcode(0x03, "RLC E"),
			new Opcode(0x04, "RLC H"),
			new Opcode(0x05, "RLC L"),
			new Opcode(0x06, "RLC (HL)"),
			new Opcode(0x07, "RLC A"),
			new Opcode(0x08, "RRC B"),
			new Opcode(0x09, "RRC C"),
			new Opcode(0x0A, "RRC D"),
			new Opcode(0x0B, "RRC E"),
			new Opcode(0x0C, "RRC H"),
			new Opcode(0x0D, "RRC L"),
			new Opcode(0x0E, "RRC (HL)"),
			new Opcode(0x0F, "RRC A"),
			new Opcode(0x10, "RL B"),
			new Opcode(0x11, "RL C"),
			new Opcode(0x12, "RL D"),
			new Opcode(0x13, "RL E"),
			new Opcode(0x14, "RL H"),
			new Opcode(0x15, "RL L"),
			new Opcode(0x16, "RL (HL)"),
			new Opcode(0x17, "RL A"),
			new Opcode(0x18, "RR B"),
			new Opcode(0x19, "RR C"),
			new Opcode(0x1A, "RR D"),
			new Opcode(0x1B, "RR E"),
			new Opcode(0x1C, "RR H"),
			new Opcode(0x1D, "RR L"),
			new Opcode(0x1E, "RR (HL)"),
			new Opcode(0x1F, "RR A"),
			new Opcode(0x20, "SLA B"),
			new Opcode(0x21, "SLA C"),
			new Opcode(0x22, "SLA D"),
			new Opcode(0x23, "SLA E"),
			new Opcode(0x24, "SLA H"),
			new Opcode(0x25, "SLA L"),
			new Opcode(0x26, "SLA (HL)"),
			new Opcode(0x27, "SLA A"),
			new Opcode(0x28, "SRA B"),
			new Opcode(0x29, "SRA C"),
			new Opcode(0x2A, "SRA D"),
			new Opcode(0x2B, "SRA E"),
			new Opcode(0x2C, "SRA H"),
			new Opcode(0x2D, "SRA L"),
			new Opcode(0x2E, "SRA (HL)"),
			new Opcode(0x2F, "SRA A"),
			new Opcode(0x30, "SLL B"),
			new Opcode(0x31, "SLL C"),
			new Opcode(0x32, "SLL D"),
			new Opcode(0x33, "SLL E"),
			new Opcode(0x34, "SLL H"),
			new Opcode(0x35, "SLL L"),
			new Opcode(0x36, "SLL (HL)"),
			new Opcode(0x37, "SLL A"),
			new Opcode(0x38, "SRL B"),
			new Opcode(0x39, "SRL C"),
			new Opcode(0x3A, "SRL D"),
			new Opcode(0x3B, "SRL E"),
			new Opcode(0x3C, "SRL H"),
			new Opcode(0x3D, "SRL L"),
			new Opcode(0x3E, "SRL (HL)"),
			new Opcode(0x3F, "SRL A"),
			new Opcode(0x40, "BIT 0,B"),
			new Opcode(0x41, "BIT 0,C"),
			new Opcode(0x42, "BIT 0,D"),
			new Opcode(0x43, "BIT 0,E"),
			new Opcode(0x44, "BIT 0,H"),
			new Opcode(0x45, "BIT 0,L"),
			new Opcode(0x46, "BIT 0,(HL)"),
			new Opcode(0x47, "BIT 0,A"),
			new Opcode(0x48, "BIT 1,B"),
			new Opcode(0x49, "BIT 1,C"),
			new Opcode(0x4A, "BIT 1,D"),
			new Opcode(0x4B, "BIT 1,E"),
			new Opcode(0x4C, "BIT 1,H"),
			new Opcode(0x4D, "BIT 1,L"),
			new Opcode(0x4E, "BIT 1,(HL)"),
			new Opcode(0x4F, "BIT 1,A"),
			new Opcode(0x50, "BIT 2,B"),
			new Opcode(0x51, "BIT 2,C"),
			new Opcode(0x52, "BIT 2,D"),
			new Opcode(0x53, "BIT 2,E"),
			new Opcode(0x54, "BIT 2,H"),
			new Opcode(0x55, "BIT 2,L"),
			new Opcode(0x56, "BIT 2,(HL)"),
			new Opcode(0x57, "BIT 2,A"),
			new Opcode(0x58, "BIT 3,B"),
			new Opcode(0x59, "BIT 3,C"),
			new Opcode(0x5A, "BIT 3,D"),
			new Opcode(0x5B, "BIT 3,E"),
			new Opcode(0x5C, "BIT 3,H"),
			new Opcode(0x5D, "BIT 3,L"),
			new Opcode(0x5E, "BIT 3,(HL)"),
			new Opcode(0x5F, "BIT 3,A"),
			new Opcode(0x60, "BIT 4,B"),
			new Opcode(0x61, "BIT 4,C"),
			new Opcode(0x62, "BIT 4,D"),
			new Opcode(0x63, "BIT 4,E"),
			new Opcode(0x64, "BIT 4,H"),
			new Opcode(0x65, "BIT 4,L"),
			new Opcode(0x66, "BIT 4,(HL)"),
			new Opcode(0x67, "BIT 4,A"),
			new Opcode(0x68, "BIT 5,B"),
			new Opcode(0x69, "BIT 5,C"),
			new Opcode(0x6A, "BIT 5,D"),
			new Opcode(0x6B, "BIT 5,E"),
			new Opcode(0x6C, "BIT 5,H"),
			new Opcode(0x6D, "BIT 5,L"),
			new Opcode(0x6E, "BIT 5,(HL)"),
			new Opcode(0x6F, "BIT 5,A"),
			new Opcode(0x70, "BIT 6,B"),
			new Opcode(0x71, "BIT 6,C"),
			new Opcode(0x72, "BIT 6,D"),
			new Opcode(0x73, "BIT 6,E"),
			new Opcode(0x74, "BIT 6,H"),
			new Opcode(0x75, "BIT 6,L"),
			new Opcode(0x76, "BIT 6,(HL)"),
			new Opcode(0x77, "BIT 6,A"),
			new Opcode(0x78, "BIT 7,B"),
			new Opcode(0x79, "BIT 7,C"),
			new Opcode(0x7A, "BIT 7,D"),
			new Opcode(0x7B, "BIT 7,E"),
			new Opcode(0x7C, "BIT 7,H"),
			new Opcode(0x7D, "BIT 7,L"),
			new Opcode(0x7E, "BIT 7,(HL)"),
			new Opcode(0x7F, "BIT 7,A"),
			new Opcode(0x80, "RES 0,B"),
			new Opcode(0x81, "RES 0,C"),
			new Opcode(0x82, "RES 0,D"),
			new Opcode(0x83, "RES 0,E"),
			new Opcode(0x84, "RES 0,H"),
			new Opcode(0x85, "RES 0,L"),
			new Opcode(0x86, "RES 0,(HL)"),
			new Opcode(0x87, "RES 0,A"),
			new Opcode(0x88, "RES 1,B"),
			new Opcode(0x89, "RES 1,C"),
			new Opcode(0x8A, "RES 1,D"),
			new Opcode(0x8B, "RES 1,E"),
			new Opcode(0x8C, "RES 1,H"),
			new Opcode(0x8D, "RES 1,L"),
			new Opcode(0x8E, "RES 1,(HL)"),
			new Opcode(0x8F, "RES 1,A"),
			new Opcode(0x90, "RES 2,B"),
			new Opcode(0x91, "RES 2,C"),
			new Opcode(0x92, "RES 2,D"),
			new Opcode(0x93, "RES 2,E"),
			new Opcode(0x94, "RES 2,H"),
			new Opcode(0x95, "RES 2,L"),
			new Opcode(0x96, "RES 2,(HL)"),
			new Opcode(0x97, "RES 2,A"),
			new Opcode(0x98, "RES 3,B"),
			new Opcode(0x99, "RES 3,C"),
			new Opcode(0x9A, "RES 3,D"),
			new Opcode(0x9B, "RES 3,E"),
			new Opcode(0x9C, "RES 3,H"),
			new Opcode(0x9D, "RES 3,L"),
			new Opcode(0x9E, "RES 3,(HL)"),
			new Opcode(0x9F, "RES 3,A"),
			new Opcode(0xA0, "RES 4,B"),
			new Opcode(0xA1, "RES 4,C"),
			new Opcode(0xA2, "RES 4,D"),
			new Opcode(0xA3, "RES 4,E"),
			new Opcode(0xA4, "RES 4,H"),
			new Opcode(0xA5, "RES 4,L"),
			new Opcode(0xA6, "RES 4,(HL)"),
			new Opcode(0xA7, "RES 4,A"),
			new Opcode(0xA8, "RES 5,B"),
			new Opcode(0xA9, "RES 5,C"),
			new Opcode(0xAA, "RES 5,D"),
			new Opcode(0xAB, "RES 5,E"),
			new Opcode(0xAC, "RES 5,H"),
			new Opcode(0xAD, "RES 5,L"),
			new Opcode(0xAE, "RES 5,(HL)"),
			new Opcode(0xAF, "RES 5,A"),
			new Opcode(0xB0, "RES 6,B"),
			new Opcode(0xB1, "RES 6,C"),
			new Opcode(0xB2, "RES 6,D"),
			new Opcode(0xB3, "RES 6,E"),
			new Opcode(0xB4, "RES 6,H"),
			new Opcode(0xB5, "RES 6,L"),
			new Opcode(0xB6, "RES 6,(HL)"),
			new Opcode(0xB7, "RES 6,A"),
			new Opcode(0xB8, "RES 7,B"),
			new Opcode(0xB9, "RES 7,C"),
			new Opcode(0xBA, "RES 7,D"),
			new Opcode(0xBB, "RES 7,E"),
			new Opcode(0xBC, "RES 7,H"),
			new Opcode(0xBD, "RES 7,L"),
			new Opcode(0xBE, "RES 7,(HL)"),
			new Opcode(0xBF, "RES 7,A"),
			new Opcode(0xC0, "SET 0,B"),
			new Opcode(0xC1, "SET 0,C"),
			new Opcode(0xC2, "SET 0,D"),
			new Opcode(0xC3, "SET 0,E"),
			new Opcode(0xC4, "SET 0,H"),
			new Opcode(0xC5, "SET 0,L"),
			new Opcode(0xC6, "SET 0,(HL)"),
			new Opcode(0xC7, "SET 0,A"),
			new Opcode(0xC8, "SET 1,B"),
			new Opcode(0xC9, "SET 1,C"),
			new Opcode(0xCA, "SET 1,D"),
			new Opcode(0xCB, "SET 1,E"),
			new Opcode(0xCC, "SET 1,H"),
			new Opcode(0xCD, "SET 1,L"),
			new Opcode(0xCE, "SET 1,(HL)"),
			new Opcode(0xCF, "SET 1,A"),
			new Opcode(0xD0, "SET 2,B"),
			new Opcode(0xD1, "SET 2,C"),
			new Opcode(0xD2, "SET 2,D"),
			new Opcode(0xD3, "SET 2,E"),
			new Opcode(0xD4, "SET 2,H"),
			new Opcode(0xD5, "SET 2,L"),
			new Opcode(0xD6, "SET 2,(HL)"),
			new Opcode(0xD7, "SET 2,A"),
			new Opcode(0xD8, "SET 3,B"),
			new Opcode(0xD9, "SET 3,C"),
			new Opcode(0xDA, "SET 3,D"),
			new Opcode(0xDB, "SET 3,E"),
			new Opcode(0xDC, "SET 3,H"),
			new Opcode(0xDD, "SET 3,L"),
			new Opcode(0xDE, "SET 3,(HL)"),
			new Opcode(0xDF, "SET 3,A"),
			new Opcode(0xE0, "SET 4,B"),
			new Opcode(0xE1, "SET 4,C"),
			new Opcode(0xE2, "SET 4,D"),
			new Opcode(0xE3, "SET 4,E"),
			new Opcode(0xE4, "SET 4,H"),
			new Opcode(0xE5, "SET 4,L"),
			new Opcode(0xE6, "SET 4,(HL)"),
			new Opcode(0xE7, "SET 4,A"),
			new Opcode(0xE8, "SET 5,B"),
			new Opcode(0xE9, "SET 5,C"),
			new Opcode(0xEA, "SET 5,D"),
			new Opcode(0xEB, "SET 5,E"),
			new Opcode(0xEC, "SET 5,H"),
			new Opcode(0xED, "SET 5,L"),
			new Opcode(0xEE, "SET 5,(HL)"),
			new Opcode(0xEF, "SET 5,A"),
			new Opcode(0xF0, "SET 6,B"),
			new Opcode(0xF1, "SET 6,C"),
			new Opcode(0xF2, "SET 6,D"),
			new Opcode(0xF3, "SET 6,E"),
			new Opcode(0xF4, "SET 6,H"),
			new Opcode(0xF5, "SET 6,L"),
			new Opcode(0xF6, "SET 6,(HL)"),
			new Opcode(0xF7, "SET 6,A"),
			new Opcode(0xF8, "SET 7,B"),
			new Opcode(0xF9, "SET 7,C"),
			new Opcode(0xFA, "SET 7,D"),
			new Opcode(0xFB, "SET 7,E"),
			new Opcode(0xFC, "SET 7,H"),
			new Opcode(0xFD, "SET 7,L"),
			new Opcode(0xFE, "SET 7,(HL)"),
			new Opcode(0xFF, "SET 7,A")
		];
		// Fix length (2)
		Opcode.OpcodesCB.forEach(opcode => {
			opcode.length++;
		});

		/// Opcodes that start with 0xDDCB.
		Opcode.OpcodesDDCB = [
			new OpcodePrevIndex(0x00, "RLC (IX%s),B"),
			new OpcodePrevIndex(0x01, "RLC (IX%s),C"),
			new OpcodePrevIndex(0x02, "RLC (IX%s),D"),
			new OpcodePrevIndex(0x03, "RLC (IX%s),E"),
			new OpcodePrevIndex(0x04, "RLC (IX%s),H"),
			new OpcodePrevIndex(0x05, "RLC (IX%s),L"),
			new OpcodePrevIndex(0x06, "RLC (IX%s)"),
			new OpcodePrevIndex(0x07, "RLC (IX%s),A"),
			new OpcodePrevIndex(0x08, "RRC (IX%s),B"),
			new OpcodePrevIndex(0x09, "RRC (IX%s),C"),
			new OpcodePrevIndex(0x0A, "RRC (IX%s),D"),
			new OpcodePrevIndex(0x0B, "RRC (IX%s),E"),
			new OpcodePrevIndex(0x0C, "RRC (IX%s),H"),
			new OpcodePrevIndex(0x0D, "RRC (IX%s),L"),
			new OpcodePrevIndex(0x0E, "RRC (IX%s)"),
			new OpcodePrevIndex(0x0F, "RRC (IX%s),A"),
			new OpcodePrevIndex(0x10, "RL (IX%s),B"),
			new OpcodePrevIndex(0x11, "RL (IX%s),C"),
			new OpcodePrevIndex(0x12, "RL (IX%s),D"),
			new OpcodePrevIndex(0x13, "RL (IX%s),E"),
			new OpcodePrevIndex(0x14, "RL (IX%s),H"),
			new OpcodePrevIndex(0x15, "RL (IX%s),L"),
			new OpcodePrevIndex(0x16, "RL (IX%s)"),
			new OpcodePrevIndex(0x17, "RL (IX%s),A"),
			new OpcodePrevIndex(0x18, "RR (IX%s),B"),
			new OpcodePrevIndex(0x19, "RR (IX%s),C"),
			new OpcodePrevIndex(0x1A, "RR (IX%s),D"),
			new OpcodePrevIndex(0x1B, "RR (IX%s),E"),
			new OpcodePrevIndex(0x1C, "RR (IX%s),H"),
			new OpcodePrevIndex(0x1D, "RR (IX%s),L"),
			new OpcodePrevIndex(0x1E, "RR (IX%s)"),
			new OpcodePrevIndex(0x1F, "RR (IX%s),A"),
			new OpcodePrevIndex(0x20, "SLA (IX%s),B"),
			new OpcodePrevIndex(0x21, "SLA (IX%s),C"),
			new OpcodePrevIndex(0x22, "SLA (IX%s),D"),
			new OpcodePrevIndex(0x23, "SLA (IX%s),E"),
			new OpcodePrevIndex(0x24, "SLA (IX%s),H"),
			new OpcodePrevIndex(0x25, "SLA (IX%s),L"),
			new OpcodePrevIndex(0x26, "SLA (IX%s)"),
			new OpcodePrevIndex(0x27, "SLA (IX%s),A"),
			new OpcodePrevIndex(0x28, "SRA (IX%s),B"),
			new OpcodePrevIndex(0x29, "SRA (IX%s),C"),
			new OpcodePrevIndex(0x2A, "SRA (IX%s),D"),
			new OpcodePrevIndex(0x2B, "SRA (IX%s),E"),
			new OpcodePrevIndex(0x2C, "SRA (IX%s),H"),
			new OpcodePrevIndex(0x2D, "SRA (IX%s),L"),
			new OpcodePrevIndex(0x2E, "SRA (IX%s)"),
			new OpcodePrevIndex(0x2F, "SRA (IX%s),A"),
			new OpcodePrevIndex(0x30, "SLL (IX%s),B"),
			new OpcodePrevIndex(0x31, "SLL (IX%s),C"),
			new OpcodePrevIndex(0x32, "SLL (IX%s),D"),
			new OpcodePrevIndex(0x33, "SLL (IX%s),E"),
			new OpcodePrevIndex(0x34, "SLL (IX%s),H"),
			new OpcodePrevIndex(0x35, "SLL (IX%s),L"),
			new OpcodePrevIndex(0x36, "SLL (IX%s)"),
			new OpcodePrevIndex(0x37, "SLL (IX%s),A"),
			new OpcodePrevIndex(0x38, "SRL (IX%s),B"),
			new OpcodePrevIndex(0x39, "SRL (IX%s),C"),
			new OpcodePrevIndex(0x3A, "SRL (IX%s),D"),
			new OpcodePrevIndex(0x3B, "SRL (IX%s),E"),
			new OpcodePrevIndex(0x3C, "SRL (IX%s),H"),
			new OpcodePrevIndex(0x3D, "SRL (IX%s),L"),
			new OpcodePrevIndex(0x3E, "SRL (IX%s)"),
			new OpcodePrevIndex(0x3F, "SRL (IX%s),A"),
			new OpcodePrevIndex(0x40, "BIT 0,(IX%s)"),
			new OpcodePrevIndex(0x41, "BIT 0,(IX%s)"),
			new OpcodePrevIndex(0x42, "BIT 0,(IX%s)"),
			new OpcodePrevIndex(0x43, "BIT 0,(IX%s)"),
			new OpcodePrevIndex(0x44, "BIT 0,(IX%s)"),
			new OpcodePrevIndex(0x45, "BIT 0,(IX%s)"),
			new OpcodePrevIndex(0x46, "BIT 0,(IX%s)"),
			new OpcodePrevIndex(0x47, "BIT 0,(IX%s)"),
			new OpcodePrevIndex(0x48, "BIT 1,(IX%s)"),
			new OpcodePrevIndex(0x49, "BIT 1,(IX%s)"),
			new OpcodePrevIndex(0x4A, "BIT 1,(IX%s)"),
			new OpcodePrevIndex(0x4B, "BIT 1,(IX%s)"),
			new OpcodePrevIndex(0x4C, "BIT 1,(IX%s)"),
			new OpcodePrevIndex(0x4D, "BIT 1,(IX%s)"),
			new OpcodePrevIndex(0x4E, "BIT 1,(IX%s)"),
			new OpcodePrevIndex(0x4F, "BIT 1,(IX%s)"),
			new OpcodePrevIndex(0x50, "BIT 2,(IX%s)"),
			new OpcodePrevIndex(0x51, "BIT 2,(IX%s)"),
			new OpcodePrevIndex(0x52, "BIT 2,(IX%s)"),
			new OpcodePrevIndex(0x53, "BIT 2,(IX%s)"),
			new OpcodePrevIndex(0x54, "BIT 2,(IX%s)"),
			new OpcodePrevIndex(0x55, "BIT 2,(IX%s)"),
			new OpcodePrevIndex(0x56, "BIT 2,(IX%s)"),
			new OpcodePrevIndex(0x57, "BIT 2,(IX%s)"),
			new OpcodePrevIndex(0x58, "BIT 3,(IX%s)"),
			new OpcodePrevIndex(0x59, "BIT 3,(IX%s)"),
			new OpcodePrevIndex(0x5A, "BIT 3,(IX%s)"),
			new OpcodePrevIndex(0x5B, "BIT 3,(IX%s)"),
			new OpcodePrevIndex(0x5C, "BIT 3,(IX%s)"),
			new OpcodePrevIndex(0x5D, "BIT 3,(IX%s)"),
			new OpcodePrevIndex(0x5E, "BIT 3,(IX%s)"),
			new OpcodePrevIndex(0x5F, "BIT 3,(IX%s)"),
			new OpcodePrevIndex(0x60, "BIT 4,(IX%s)"),
			new OpcodePrevIndex(0x61, "BIT 4,(IX%s)"),
			new OpcodePrevIndex(0x62, "BIT 4,(IX%s)"),
			new OpcodePrevIndex(0x63, "BIT 4,(IX%s)"),
			new OpcodePrevIndex(0x64, "BIT 4,(IX%s)"),
			new OpcodePrevIndex(0x65, "BIT 4,(IX%s)"),
			new OpcodePrevIndex(0x66, "BIT 4,(IX%s)"),
			new OpcodePrevIndex(0x67, "BIT 4,(IX%s)"),
			new OpcodePrevIndex(0x68, "BIT 5,(IX%s)"),
			new OpcodePrevIndex(0x69, "BIT 5,(IX%s)"),
			new OpcodePrevIndex(0x6A, "BIT 5,(IX%s)"),
			new OpcodePrevIndex(0x6B, "BIT 5,(IX%s)"),
			new OpcodePrevIndex(0x6C, "BIT 5,(IX%s)"),
			new OpcodePrevIndex(0x6D, "BIT 5,(IX%s)"),
			new OpcodePrevIndex(0x6E, "BIT 5,(IX%s)"),
			new OpcodePrevIndex(0x6F, "BIT 5,(IX%s)"),
			new OpcodePrevIndex(0x70, "BIT 6,(IX%s)"),
			new OpcodePrevIndex(0x71, "BIT 6,(IX%s)"),
			new OpcodePrevIndex(0x72, "BIT 6,(IX%s)"),
			new OpcodePrevIndex(0x73, "BIT 6,(IX%s)"),
			new OpcodePrevIndex(0x74, "BIT 6,(IX%s)"),
			new OpcodePrevIndex(0x75, "BIT 6,(IX%s)"),
			new OpcodePrevIndex(0x76, "BIT 6,(IX%s)"),
			new OpcodePrevIndex(0x77, "BIT 6,(IX%s)"),
			new OpcodePrevIndex(0x78, "BIT 7,(IX%s)"),
			new OpcodePrevIndex(0x79, "BIT 7,(IX%s)"),
			new OpcodePrevIndex(0x7A, "BIT 7,(IX%s)"),
			new OpcodePrevIndex(0x7B, "BIT 7,(IX%s)"),
			new OpcodePrevIndex(0x7C, "BIT 7,(IX%s)"),
			new OpcodePrevIndex(0x7D, "BIT 7,(IX%s)"),
			new OpcodePrevIndex(0x7E, "BIT 7,(IX%s)"),
			new OpcodePrevIndex(0x7F, "BIT 7,(IX%s)"),
			new OpcodePrevIndex(0x80, "RES 0,(IX%s),B"),
			new OpcodePrevIndex(0x81, "RES 0,(IX%s),C"),
			new OpcodePrevIndex(0x82, "RES 0,(IX%s),D"),
			new OpcodePrevIndex(0x83, "RES 0,(IX%s),E"),
			new OpcodePrevIndex(0x84, "RES 0,(IX%s),H"),
			new OpcodePrevIndex(0x85, "RES 0,(IX%s),L"),
			new OpcodePrevIndex(0x86, "RES 0,(IX%s)"),
			new OpcodePrevIndex(0x87, "RES 0,(IX%s),A"),
			new OpcodePrevIndex(0x88, "RES 1,(IX%s),B"),
			new OpcodePrevIndex(0x89, "RES 1,(IX%s),C"),
			new OpcodePrevIndex(0x8A, "RES 1,(IX%s),D"),
			new OpcodePrevIndex(0x8B, "RES 1,(IX%s),E"),
			new OpcodePrevIndex(0x8C, "RES 1,(IX%s),H"),
			new OpcodePrevIndex(0x8D, "RES 1,(IX%s),L"),
			new OpcodePrevIndex(0x8E, "RES 1,(IX%s)"),
			new OpcodePrevIndex(0x8F, "RES 1,(IX%s),A"),
			new OpcodePrevIndex(0x90, "RES 2,(IX%s),B"),
			new OpcodePrevIndex(0x91, "RES 2,(IX%s),C"),
			new OpcodePrevIndex(0x92, "RES 2,(IX%s),D"),
			new OpcodePrevIndex(0x93, "RES 2,(IX%s),E"),
			new OpcodePrevIndex(0x94, "RES 2,(IX%s),H"),
			new OpcodePrevIndex(0x95, "RES 2,(IX%s),L"),
			new OpcodePrevIndex(0x96, "RES 2,(IX%s)"),
			new OpcodePrevIndex(0x97, "RES 2,(IX%s),A"),
			new OpcodePrevIndex(0x98, "RES 3,(IX%s),B"),
			new OpcodePrevIndex(0x99, "RES 3,(IX%s),C"),
			new OpcodePrevIndex(0x9A, "RES 3,(IX%s),D"),
			new OpcodePrevIndex(0x9B, "RES 3,(IX%s),E"),
			new OpcodePrevIndex(0x9C, "RES 3,(IX%s),H"),
			new OpcodePrevIndex(0x9D, "RES 3,(IX%s),L"),
			new OpcodePrevIndex(0x9E, "RES 3,(IX%s)"),
			new OpcodePrevIndex(0x9F, "RES 3,(IX%s),A"),
			new OpcodePrevIndex(0xA0, "RES 4,(IX%s),B"),
			new OpcodePrevIndex(0xA1, "RES 4,(IX%s),C"),
			new OpcodePrevIndex(0xA2, "RES 4,(IX%s),D"),
			new OpcodePrevIndex(0xA3, "RES 4,(IX%s),E"),
			new OpcodePrevIndex(0xA4, "RES 4,(IX%s),H"),
			new OpcodePrevIndex(0xA5, "RES 4,(IX%s),L"),
			new OpcodePrevIndex(0xA6, "RES 4,(IX%s)"),
			new OpcodePrevIndex(0xA7, "RES 4,(IX%s),A"),
			new OpcodePrevIndex(0xA8, "RES 5,(IX%s),B"),
			new OpcodePrevIndex(0xA9, "RES 5,(IX%s),C"),
			new OpcodePrevIndex(0xAA, "RES 5,(IX%s),D"),
			new OpcodePrevIndex(0xAB, "RES 5,(IX%s),E"),
			new OpcodePrevIndex(0xAC, "RES 5,(IX%s),H"),
			new OpcodePrevIndex(0xAD, "RES 5,(IX%s),L"),
			new OpcodePrevIndex(0xAE, "RES 5,(IX%s)"),
			new OpcodePrevIndex(0xAF, "RES 5,(IX%s),A"),
			new OpcodePrevIndex(0xB0, "RES 6,(IX%s),B"),
			new OpcodePrevIndex(0xB1, "RES 6,(IX%s),C"),
			new OpcodePrevIndex(0xB2, "RES 6,(IX%s),D"),
			new OpcodePrevIndex(0xB3, "RES 6,(IX%s),E"),
			new OpcodePrevIndex(0xB4, "RES 6,(IX%s),H"),
			new OpcodePrevIndex(0xB5, "RES 6,(IX%s),L"),
			new OpcodePrevIndex(0xB6, "RES 6,(IX%s)"),
			new OpcodePrevIndex(0xB7, "RES 6,(IX%s),A"),
			new OpcodePrevIndex(0xB8, "RES 7,(IX%s),B"),
			new OpcodePrevIndex(0xB9, "RES 7,(IX%s),C"),
			new OpcodePrevIndex(0xBA, "RES 7,(IX%s),D"),
			new OpcodePrevIndex(0xBB, "RES 7,(IX%s),E"),
			new OpcodePrevIndex(0xBC, "RES 7,(IX%s),H"),
			new OpcodePrevIndex(0xBD, "RES 7,(IX%s),L"),
			new OpcodePrevIndex(0xBE, "RES 7,(IX%s)"),
			new OpcodePrevIndex(0xBF, "RES 7,(IX%s),A"),
			new OpcodePrevIndex(0xC0, "SET 0,(IX%s),B"),
			new OpcodePrevIndex(0xC1, "SET 0,(IX%s),C"),
			new OpcodePrevIndex(0xC2, "SET 0,(IX%s),D"),
			new OpcodePrevIndex(0xC3, "SET 0,(IX%s),E"),
			new OpcodePrevIndex(0xC4, "SET 0,(IX%s),H"),
			new OpcodePrevIndex(0xC5, "SET 0,(IX%s),L"),
			new OpcodePrevIndex(0xC6, "SET 0,(IX%s)"),
			new OpcodePrevIndex(0xC7, "SET 0,(IX%s),A"),
			new OpcodePrevIndex(0xC8, "SET 1,(IX%s),B"),
			new OpcodePrevIndex(0xC9, "SET 1,(IX%s),C"),
			new OpcodePrevIndex(0xCA, "SET 1,(IX%s),D"),
			new OpcodePrevIndex(0xCB, "SET 1,(IX%s),E"),
			new OpcodePrevIndex(0xCC, "SET 1,(IX%s),H"),
			new OpcodePrevIndex(0xCD, "SET 1,(IX%s),L"),
			new OpcodePrevIndex(0xCE, "SET 1,(IX%s)"),
			new OpcodePrevIndex(0xCF, "SET 1,(IX%s),A"),
			new OpcodePrevIndex(0xD0, "SET 2,(IX%s),B"),
			new OpcodePrevIndex(0xD1, "SET 2,(IX%s),C"),
			new OpcodePrevIndex(0xD2, "SET 2,(IX%s),D"),
			new OpcodePrevIndex(0xD3, "SET 2,(IX%s),E"),
			new OpcodePrevIndex(0xD4, "SET 2,(IX%s),H"),
			new OpcodePrevIndex(0xD5, "SET 2,(IX%s),L"),
			new OpcodePrevIndex(0xD6, "SET 2,(IX%s)"),
			new OpcodePrevIndex(0xD7, "SET 2,(IX%s),A"),
			new OpcodePrevIndex(0xD8, "SET 3,(IX%s),B"),
			new OpcodePrevIndex(0xD9, "SET 3,(IX%s),C"),
			new OpcodePrevIndex(0xDA, "SET 3,(IX%s),D"),
			new OpcodePrevIndex(0xDB, "SET 3,(IX%s),E"),
			new OpcodePrevIndex(0xDC, "SET 3,(IX%s),H"),
			new OpcodePrevIndex(0xDD, "SET 3,(IX%s),L"),
			new OpcodePrevIndex(0xDE, "SET 3,(IX%s)"),
			new OpcodePrevIndex(0xDF, "SET 3,(IX%s),A"),
			new OpcodePrevIndex(0xE0, "SET 4,(IX%s),B"),
			new OpcodePrevIndex(0xE1, "SET 4,(IX%s),C"),
			new OpcodePrevIndex(0xE2, "SET 4,(IX%s),D"),
			new OpcodePrevIndex(0xE3, "SET 4,(IX%s),E"),
			new OpcodePrevIndex(0xE4, "SET 4,(IX%s),H"),
			new OpcodePrevIndex(0xE5, "SET 4,(IX%s),L"),
			new OpcodePrevIndex(0xE6, "SET 4,(IX%s)"),
			new OpcodePrevIndex(0xE7, "SET 4,(IX%s),A"),
			new OpcodePrevIndex(0xE8, "SET 5,(IX%s),B"),
			new OpcodePrevIndex(0xE9, "SET 5,(IX%s),C"),
			new OpcodePrevIndex(0xEA, "SET 5,(IX%s),D"),
			new OpcodePrevIndex(0xEB, "SET 5,(IX%s),E"),
			new OpcodePrevIndex(0xEC, "SET 5,(IX%s),H"),
			new OpcodePrevIndex(0xED, "SET 5,(IX%s),L"),
			new OpcodePrevIndex(0xEE, "SET 5,(IX%s)"),
			new OpcodePrevIndex(0xEF, "SET 5,(IX%s),A"),
			new OpcodePrevIndex(0xF0, "SET 6,(IX%s),B"),
			new OpcodePrevIndex(0xF1, "SET 6,(IX%s),C"),
			new OpcodePrevIndex(0xF2, "SET 6,(IX%s),D"),
			new OpcodePrevIndex(0xF3, "SET 6,(IX%s),E"),
			new OpcodePrevIndex(0xF4, "SET 6,(IX%s),H"),
			new OpcodePrevIndex(0xF5, "SET 6,(IX%s),L"),
			new OpcodePrevIndex(0xF6, "SET 6,(IX%s)"),
			new OpcodePrevIndex(0xF7, "SET 6,(IX%s),A"),
			new OpcodePrevIndex(0xF8, "SET 7,(IX%s),B"),
			new OpcodePrevIndex(0xF9, "SET 7,(IX%s),C"),
			new OpcodePrevIndex(0xFA, "SET 7,(IX%s),D"),
			new OpcodePrevIndex(0xFB, "SET 7,(IX%s),E"),
			new OpcodePrevIndex(0xFC, "SET 7,(IX%s),H"),
			new OpcodePrevIndex(0xFD, "SET 7,(IX%s),L"),
			new OpcodePrevIndex(0xFE, "SET 7,(IX%s)"),
			new OpcodePrevIndex(0xFF, "SET 7,(IX%s),A")
		];
		// Fix length (4)
		Opcode.OpcodesDDCB.forEach(opcode => {
			opcode.length += 1;
		});

		/// Opcodes that start with 0xFDCB.
		/// Create FDCB (use IY instead of IX)
		Opcode.OpcodesFDCB = Opcode.OpcodesDDCB.map(opcode => {
			const opcodeFDCB = opcode.clone();
			const name = opcode.name.replace('IX', 'IY');
			opcodeFDCB.name = name;
			return opcodeFDCB;
		});

		/// Opcodes that start with 0xDD.
		Opcode.OpcodesDD = [
			new OpcodeInvalid(0x00),
			new OpcodeInvalid(0x01),
			new OpcodeInvalid(0x02),
			new OpcodeInvalid(0x03),
			new OpcodeInvalid(0x04),
			new OpcodeInvalid(0x05),
			new OpcodeInvalid(0x06),
			new OpcodeInvalid(0x07),
			new OpcodeInvalid(0x08),
			new Opcode(0x09, "ADD IX,BC"),
			new OpcodeInvalid(0x0A),
			new OpcodeInvalid(0x0B),
			new OpcodeInvalid(0x0C),
			new OpcodeInvalid(0x0D),
			new OpcodeInvalid(0x0E),
			new OpcodeInvalid(0x0F),
			new OpcodeInvalid(0x10),
			new OpcodeInvalid(0x11),
			new OpcodeInvalid(0x12),
			new OpcodeInvalid(0x13),
			new OpcodeInvalid(0x14),
			new OpcodeInvalid(0x15),
			new OpcodeInvalid(0x16),
			new OpcodeInvalid(0x17),
			new OpcodeInvalid(0x18),
			new Opcode(0x19, "ADD IX,DE"),
			new OpcodeInvalid(0x1A),
			new OpcodeInvalid(0x1B),
			new OpcodeInvalid(0x1C),
			new OpcodeInvalid(0x1D),
			new OpcodeInvalid(0x1E),
			new OpcodeInvalid(0x1F),
			new OpcodeInvalid(0x20),
			new Opcode(0x21, "LD IX,#nn"),
			new Opcode(0x22, "LD (#nn),IX"),
			new Opcode(0x23, "INC IX"),
			new Opcode(0x24, "INC IXH"),
			new Opcode(0x25, "DEC IXH"),
			new Opcode(0x26, "LD IXH,#n"),
			new OpcodeInvalid(0x27),
			new OpcodeInvalid(0x28),
			new Opcode(0x29, "ADD IX,IX"),
			new Opcode(0x2A, "LD IX,(#nn)"),
			new Opcode(0x2B, "DEC IX"),
			new Opcode(0x2C, "INC IXL"),
			new Opcode(0x2D, "DEC IXL"),
			new Opcode(0x2E, "LD IXL,#n"),
			new OpcodeInvalid(0x2F),
			new OpcodeInvalid(0x30),
			new OpcodeInvalid(0x31),
			new OpcodeInvalid(0x32),
			new OpcodeInvalid(0x33),
			new OpcodeIndex(0x34, "INC (IX%s)"),
			new OpcodeIndex(0x35, "DEC (IX%s)"),
			new OpcodeIndexImmediate(0x36, 'LD (IX%s),%s'),
			new OpcodeInvalid(0x37),
			new OpcodeInvalid(0x38),
			new Opcode(0x39, "ADD IX,SP"),
			new OpcodeInvalid(0x3A),
			new OpcodeInvalid(0x3B),
			new OpcodeInvalid(0x3C),
			new OpcodeInvalid(0x3D),
			new OpcodeInvalid(0x3E),
			new OpcodeInvalid(0x3F),
			new OpcodeInvalid(0x40),
			new OpcodeInvalid(0x41),
			new OpcodeInvalid(0x42),
			new OpcodeInvalid(0x43),
			new Opcode(0x44, "LD B,IXH"),
			new Opcode(0x45, "LD B,IXL"),
			new OpcodeIndex(0x46, "LD B,(IX%s)"),
			new OpcodeInvalid(0x47),
			new OpcodeInvalid(0x48),
			new OpcodeInvalid(0x49),
			new OpcodeInvalid(0x4A),
			new OpcodeInvalid(0x4B),
			new Opcode(0x4C, "LD C,IXH"),
			new Opcode(0x4D, "LD C,IXL"),
			new OpcodeIndex(0x4E, "LD C,(IX%s)"),
			new OpcodeInvalid(0x4F),
			new OpcodeInvalid(0x50),
			new OpcodeInvalid(0x51),
			new OpcodeInvalid(0x52),
			new OpcodeInvalid(0x53),
			new Opcode(0x54, "LD D,IXH"),
			new Opcode(0x55, "LD D,IXL"),
			new OpcodeIndex(0x56, "LD D,(IX%s)"),
			new OpcodeInvalid(0x57),
			new OpcodeInvalid(0x58),
			new OpcodeInvalid(0x59),
			new OpcodeInvalid(0x5A),
			new OpcodeInvalid(0x5B),
			new Opcode(0x5C, "LD E,IXH"),
			new Opcode(0x5D, "LD E,IXL"),
			new OpcodeIndex(0x5E, "LD E,(IX%s)"),
			new OpcodeInvalid(0x5F),
			new Opcode(0x60, "LD IXH,B"),
			new Opcode(0x61, "LD IXH,C"),
			new Opcode(0x62, "LD IXH,D"),
			new Opcode(0x63, "LD IXH,E"),
			new Opcode(0x64, "LD IXH,IXH"),
			new Opcode(0x65, "LD IXH,IXL"),
			new OpcodeIndex(0x66, "LD H,(IX%s)"),
			new Opcode(0x67, "LD IXH,A"),
			new Opcode(0x68, "LD IXL,B"),
			new Opcode(0x69, "LD IXL,C"),
			new Opcode(0x6A, "LD IXL,D"),
			new Opcode(0x6B, "LD IXL,E"),
			new Opcode(0x6C, "LD IXL,IXH"),
			new Opcode(0x6D, "LD IXL,IXL"),
			new OpcodeIndex(0x6E, "LD L,(IX%s)"),
			new Opcode(0x6F, "LD IXL,A"),
			new OpcodeIndex(0x70, "LD (IX%s),B"),
			new OpcodeIndex(0x71, "LD (IX%s),C"),
			new OpcodeIndex(0x72, "LD (IX%s),D"),
			new OpcodeIndex(0x73, "LD (IX%s),E"),
			new OpcodeIndex(0x74, "LD (IX%s),H"),
			new OpcodeIndex(0x75, "LD (IX%s),L"),
			new OpcodeInvalid(0x76),
			new OpcodeIndex(0x77, "LD (IX%s),A"),
			new OpcodeInvalid(0x78),
			new OpcodeInvalid(0x79),
			new OpcodeInvalid(0x7A),
			new OpcodeInvalid(0x7B),
			new Opcode(0x7C, "LD A,IXH"),
			new Opcode(0x7D, "LD A,IXL"),
			new OpcodeIndex(0x7E, "LD A,(IX%s)"),
			new OpcodeInvalid(0x7F),
			new OpcodeInvalid(0x80),
			new OpcodeInvalid(0x81),
			new OpcodeInvalid(0x82),
			new OpcodeInvalid(0x83),
			new Opcode(0x84, "ADD A,IXH"),
			new Opcode(0x85, "ADD A,IXL"),
			new OpcodeIndex(0x86, "ADD A,(IX%s)"),
			new OpcodeInvalid(0x87),
			new OpcodeInvalid(0x88),
			new OpcodeInvalid(0x89),
			new OpcodeInvalid(0x8A),
			new OpcodeInvalid(0x8B),
			new Opcode(0x8C, "ADC A,IXH"),
			new Opcode(0x8D, "ADC A,IXL"),
			new OpcodeIndex(0x8E, "ADC A,(IX%s)"),
			new OpcodeInvalid(0x8F),
			new OpcodeInvalid(0x90),
			new OpcodeInvalid(0x91),
			new OpcodeInvalid(0x92),
			new OpcodeInvalid(0x93),
			new Opcode(0x94, "SUB IXH"),
			new Opcode(0x95, "SUB IXL"),
			new OpcodeIndex(0x96, "SUB (IX%s)"),
			new OpcodeInvalid(0x97),
			new OpcodeInvalid(0x98),
			new OpcodeInvalid(0x99),
			new OpcodeInvalid(0x9A),
			new OpcodeInvalid(0x9B),
			new Opcode(0x9C, "SBC A,IXH"),
			new Opcode(0x9D, "SBC A,IXL"),
			new OpcodeIndex(0x9E, "SBC A,(IX%s)"),
			new OpcodeInvalid(0x9F),
			new OpcodeInvalid(0xA0),
			new OpcodeInvalid(0xA1),
			new OpcodeInvalid(0xA2),
			new OpcodeInvalid(0xA3),
			new Opcode(0xA4, "AND IXH"),
			new Opcode(0xA5, "AND IXL"),
			new OpcodeIndex(0xA6, "AND (IX%s)"),
			new OpcodeInvalid(0xA7),
			new OpcodeInvalid(0xA8),
			new OpcodeInvalid(0xA9),
			new OpcodeInvalid(0xAA),
			new OpcodeInvalid(0xAB),
			new Opcode(0xAC, "XOR IXH"),
			new Opcode(0xAD, "XOR IXL"),
			new OpcodeIndex(0xAE, "XOR (IX%s)"),
			new OpcodeInvalid(0xAF),
			new OpcodeInvalid(0xB0),
			new OpcodeInvalid(0xB1),
			new OpcodeInvalid(0xB2),
			new OpcodeInvalid(0xB3),
			new Opcode(0xB4, "OR IXH"),
			new Opcode(0xB5, "OR IXL"),
			new OpcodeIndex(0xB6, "OR (IX%s)"),
			new OpcodeInvalid(0xB7),
			new OpcodeInvalid(0xB8),
			new OpcodeInvalid(0xB9),
			new OpcodeInvalid(0xBA),
			new OpcodeInvalid(0xBB),
			new Opcode(0xBC, "CP IXH"),
			new Opcode(0xBD, "CP IXL"),
			new OpcodeIndex(0xBE, "CP (IX%s)"),
			new OpcodeInvalid(0xBF),
			new OpcodeInvalid(0xC0),
			new OpcodeInvalid(0xC1),
			new OpcodeInvalid(0xC2),
			new OpcodeInvalid(0xC3),
			new OpcodeInvalid(0xC4),
			new OpcodeInvalid(0xC5),
			new OpcodeInvalid(0xC6),
			new OpcodeInvalid(0xC7),
			new OpcodeInvalid(0xC8),
			new OpcodeInvalid(0xC9),
			new OpcodeInvalid(0xCA),
			new OpcodeExtended2(0xCB, Opcode.OpcodesDDCB),
			new OpcodeInvalid(0xCC),
			new OpcodeInvalid(0xCD),
			new OpcodeInvalid(0xCE),
			new OpcodeInvalid(0xCF),
			new OpcodeInvalid(0xD0),
			new OpcodeInvalid(0xD1),
			new OpcodeInvalid(0xD2),
			new OpcodeInvalid(0xD3),
			new OpcodeInvalid(0xD4),
			new OpcodeInvalid(0xD5),
			new OpcodeInvalid(0xD6),
			new OpcodeInvalid(0xD7),
			new OpcodeInvalid(0xD8),
			new OpcodeInvalid(0xD9),
			new OpcodeInvalid(0xDA),
			new OpcodeInvalid(0xDB),
			new OpcodeInvalid(0xDC),
			new OpcodeNOP(0xDD),
			new OpcodeInvalid(0xDE),
			new OpcodeInvalid(0xDF),
			new OpcodeInvalid(0xE0),
			new Opcode(0xE1, "POP IX"),
			new OpcodeInvalid(0xE2),
			new Opcode(0xE3, "EX (SP),IX"),
			new OpcodeInvalid(0xE4),
			new Opcode(0xE5, "PUSH IX"),
			new OpcodeInvalid(0xE6),
			new OpcodeInvalid(0xE7),
			new OpcodeInvalid(0xE8),
			new Opcode(0xE9, "JP (IX)"),
			new OpcodeInvalid(0xEA),
			new OpcodeInvalid(0xEB),
			new OpcodeInvalid(0xEC),
			new OpcodeNOP(0xED),
			new OpcodeInvalid(0xEE),
			new OpcodeInvalid(0xEF),
			new OpcodeInvalid(0xF0),
			new OpcodeInvalid(0xF1),
			new OpcodeInvalid(0xF2),
			new OpcodeInvalid(0xF3),
			new OpcodeInvalid(0xF4),
			new OpcodeInvalid(0xF5),
			new OpcodeInvalid(0xF6),
			new OpcodeInvalid(0xF7),
			new OpcodeInvalid(0xF8),
			new Opcode(0xF9, "LD SP,IX"),
			new OpcodeInvalid(0xFA),
			new OpcodeInvalid(0xFB),
			new OpcodeInvalid(0xFC),
			new OpcodeNOP(0xFD),
			new OpcodeInvalid(0xFE),
			new OpcodeInvalid(0xFF),
		];
		// Fix length (2)
		Opcode.OpcodesDD.forEach(opcode => {
			opcode.length++;
		});

		/// Opcodes that start with 0xFD.
		/// Create FD (use IY instead of IX)
		Opcode.OpcodesFD = Opcode.OpcodesDD.map(opcode => {
			let opcodeFD;
			// Check for extended opcode
			if (opcode.code == 0xCB) {
				opcodeFD = new OpcodeExtended2(0xCB, Opcode.OpcodesFDCB);
			}
			else {
				// Simple copy
				opcodeFD = opcode.clone();
				opcodeFD.name = opcode.name.replace(/IX/g, 'IY');
			}
			return opcodeFD;
		});

		// Normal Opcodes
		Opcode.Opcodes = [
			new Opcode(0x00, "NOP"),
			new Opcode(0x01, "LD BC,#nn"),
			new Opcode(0x02, "LD (BC),A"),
			new Opcode(0x03, "INC BC"),
			new Opcode(0x04, "INC B"),
			new Opcode(0x05, "DEC B"),
			new Opcode(0x06, "LD B,#n"),
			new Opcode(0x07, "RLCA"),
			new Opcode(0x08, "EX AF,AF'"),
			new Opcode(0x09, "ADD HL,BC"),
			new Opcode(0x0A, "LD A,(BC)"),
			new Opcode(0x0B, "DEC BC"),
			new Opcode(0x0C, "INC C"),
			new Opcode(0x0D, "DEC C"),
			new Opcode(0x0E, "LD C,#n"),
			new Opcode(0x0F, "RRCA"),
			new Opcode(0x10, "DJNZ #n"),
			new Opcode(0x11, "LD DE,#nn"),
			new Opcode(0x12, "LD (DE),A"),
			new Opcode(0x13, "INC DE"),
			new Opcode(0x14, "INC D"),
			new Opcode(0x15, "DEC D"),
			new Opcode(0x16, "LD D,#n"),
			new Opcode(0x17, "RLA"),
			new Opcode(0x18, "JR #n"),
			new Opcode(0x19, "ADD HL,DE"),
			new Opcode(0x1A, "LD A,(DE)"),
			new Opcode(0x1B, "DEC DE"),
			new Opcode(0x1C, "INC E"),
			new Opcode(0x1D, "DEC E"),
			new Opcode(0x1E, "LD E,#n"),
			new Opcode(0x1F, "RRA"),
			new Opcode(0x20, "JR NZ,#n"),
			new Opcode(0x21, "LD HL,#nn"),
			new Opcode(0x22, "LD (#nn),HL"),
			new Opcode(0x23, "INC HL"),
			new Opcode(0x24, "INC H"),
			new Opcode(0x25, "DEC H"),
			new Opcode(0x26, "LD H,#n"),
			new Opcode(0x27, "DAA"),
			new Opcode(0x28, "JR Z,#n"),
			new Opcode(0x29, "ADD HL,HL"),
			new Opcode(0x2A, "LD HL,(#nn)"),
			new Opcode(0x2B, "DEC HL"),
			new Opcode(0x2C, "INC L"),
			new Opcode(0x2D, "DEC L"),
			new Opcode(0x2E, "LD L,#n"),
			new Opcode(0x2F, "CPL"),
			new Opcode(0x30, "JR NC,#n"),
			new Opcode(0x31, "LD SP,#nn"),
			new Opcode(0x32, "LD (#nn),A"),
			new Opcode(0x33, "INC SP"),
			new Opcode(0x34, "INC (HL)"),
			new Opcode(0x35, "DEC (HL)"),
			new Opcode(0x36, "LD (HL),#n"),
			new Opcode(0x37, "SCF"),
			new Opcode(0x38, "JR C,#n"),
			new Opcode(0x39, "ADD HL,SP"),
			new Opcode(0x3A, "LD A,(#nn)"),
			new Opcode(0x3B, "DEC SP"),
			new Opcode(0x3C, "INC A"),
			new Opcode(0x3D, "DEC A"),
			new Opcode(0x3E, "LD A,#n"),
			new Opcode(0x3F, "CCF"),
			new Opcode(0x40, "LD B,B"),
			new Opcode(0x41, "LD B,C"),
			new Opcode(0x42, "LD B,D"),
			new Opcode(0x43, "LD B,E"),
			new Opcode(0x44, "LD B,H"),
			new Opcode(0x45, "LD B,L"),
			new Opcode(0x46, "LD B,(HL)"),
			new Opcode(0x47, "LD B,A"),
			new Opcode(0x48, "LD C,B"),
			new Opcode(0x49, "LD C,C"),
			new Opcode(0x4A, "LD C,D"),
			new Opcode(0x4B, "LD C,E"),
			new Opcode(0x4C, "LD C,H"),
			new Opcode(0x4D, "LD C,L"),
			new Opcode(0x4E, "LD C,(HL)"),
			new Opcode(0x4F, "LD C,A"),
			new Opcode(0x50, "LD D,B"),
			new Opcode(0x51, "LD D,C"),
			new Opcode(0x52, "LD D,D"),
			new Opcode(0x53, "LD D,E"),
			new Opcode(0x54, "LD D,H"),
			new Opcode(0x55, "LD D,L"),
			new Opcode(0x56, "LD D,(HL)"),
			new Opcode(0x57, "LD D,A"),
			new Opcode(0x58, "LD E,B"),
			new Opcode(0x59, "LD E,C"),
			new Opcode(0x5A, "LD E,D"),
			new Opcode(0x5B, "LD E,E"),
			new Opcode(0x5C, "LD E,H"),
			new Opcode(0x5D, "LD E,L"),
			new Opcode(0x5E, "LD E,(HL)"),
			new Opcode(0x5F, "LD E,A"),
			new Opcode(0x60, "LD H,B"),
			new Opcode(0x61, "LD H,C"),
			new Opcode(0x62, "LD H,D"),
			new Opcode(0x63, "LD H,E"),
			new Opcode(0x64, "LD H,H"),
			new Opcode(0x65, "LD H,L"),
			new Opcode(0x66, "LD H,(HL)"),
			new Opcode(0x67, "LD H,A"),
			new Opcode(0x68, "LD L,B"),
			new Opcode(0x69, "LD L,C"),
			new Opcode(0x6A, "LD L,D"),
			new Opcode(0x6B, "LD L,E"),
			new Opcode(0x6C, "LD L,H"),
			new Opcode(0x6D, "LD L,L"),
			new Opcode(0x6E, "LD L,(HL)"),
			new Opcode(0x6F, "LD L,A"),
			new Opcode(0x70, "LD (HL),B"),
			new Opcode(0x71, "LD (HL),C"),
			new Opcode(0x72, "LD (HL),D"),
			new Opcode(0x73, "LD (HL),E"),
			new Opcode(0x74, "LD (HL),H"),
			new Opcode(0x75, "LD (HL),L"),
			new Opcode(0x76, "HALT"),
			new Opcode(0x77, "LD (HL),A"),
			new Opcode(0x78, "LD A,B"),
			new Opcode(0x79, "LD A,C"),
			new Opcode(0x7A, "LD A,D"),
			new Opcode(0x7B, "LD A,E"),
			new Opcode(0x7C, "LD A,H"),
			new Opcode(0x7D, "LD A,L"),
			new Opcode(0x7E, "LD A,(HL)"),
			new Opcode(0x7F, "LD A,A"),
			new Opcode(0x80, "ADD A,B"),
			new Opcode(0x81, "ADD A,C"),
			new Opcode(0x82, "ADD A,D"),
			new Opcode(0x83, "ADD A,E"),
			new Opcode(0x84, "ADD A,H"),
			new Opcode(0x85, "ADD A,L"),
			new Opcode(0x86, "ADD A,(HL)"),
			new Opcode(0x87, "ADD A,A"),
			new Opcode(0x88, "ADC A,B"),
			new Opcode(0x89, "ADC A,C"),
			new Opcode(0x8A, "ADC A,D"),
			new Opcode(0x8B, "ADC A,E"),
			new Opcode(0x8C, "ADC A,H"),
			new Opcode(0x8D, "ADC A,L"),
			new Opcode(0x8E, "ADC A,(HL)"),
			new Opcode(0x8F, "ADC A,A"),
			new Opcode(0x90, "SUB B"),
			new Opcode(0x91, "SUB C"),
			new Opcode(0x92, "SUB D"),
			new Opcode(0x93, "SUB E"),
			new Opcode(0x94, "SUB H"),
			new Opcode(0x95, "SUB L"),
			new Opcode(0x96, "SUB (HL)"),
			new Opcode(0x97, "SUB A"),
			new Opcode(0x98, "SBC A,B"),
			new Opcode(0x99, "SBC A,C"),
			new Opcode(0x9A, "SBC A,D"),
			new Opcode(0x9B, "SBC A,E"),
			new Opcode(0x9C, "SBC A,H"),
			new Opcode(0x9D, "SBC A,L"),
			new Opcode(0x9E, "SBC A,(HL)"),
			new Opcode(0x9F, "SBC A,A"),
			new Opcode(0xA0, "AND B"),
			new Opcode(0xA1, "AND C"),
			new Opcode(0xA2, "AND D"),
			new Opcode(0xA3, "AND E"),
			new Opcode(0xA4, "AND H"),
			new Opcode(0xA5, "AND L"),
			new Opcode(0xA6, "AND (HL)"),
			new Opcode(0xA7, "AND A"),
			new Opcode(0xA8, "XOR B"),
			new Opcode(0xA9, "XOR C"),
			new Opcode(0xAA, "XOR D"),
			new Opcode(0xAB, "XOR E"),
			new Opcode(0xAC, "XOR H"),
			new Opcode(0xAD, "XOR L"),
			new Opcode(0xAE, "XOR (HL)"),
			new Opcode(0xAF, "XOR A"),
			new Opcode(0xB0, "OR B"),
			new Opcode(0xB1, "OR C"),
			new Opcode(0xB2, "OR D"),
			new Opcode(0xB3, "OR E"),
			new Opcode(0xB4, "OR H"),
			new Opcode(0xB5, "OR L"),
			new Opcode(0xB6, "OR (HL)"),
			new Opcode(0xB7, "OR A"),
			new Opcode(0xB8, "CP B"),
			new Opcode(0xB9, "CP C"),
			new Opcode(0xBA, "CP D"),
			new Opcode(0xBB, "CP E"),
			new Opcode(0xBC, "CP H"),
			new Opcode(0xBD, "CP L"),
			new Opcode(0xBE, "CP (HL)"),
			new Opcode(0xBF, "CP A"),
			new Opcode(0xC0, "RET NZ"),
			new Opcode(0xC1, "POP BC"),
			new Opcode(0xC2, "JP NZ,#nn"),
			new Opcode(0xC3, "JP #nn"),
			new Opcode(0xC4, "CALL NZ,#nn"),
			new Opcode(0xC5, "PUSH BC"),
			new Opcode(0xC6, "ADD A,#n"),
			new Opcode(0xC7, "RST %s"),
			new Opcode(0xC8, "RET Z"),
			new Opcode(0xC9, "RET"),
			new Opcode(0xCA, "JP Z,#nn"),
			new OpcodeExtended(0xCB, Opcode.OpcodesCB),
			new Opcode(0xCC, "CALL Z,#nn"),
			new Opcode(0xCD, "CALL #nn"),
			new Opcode(0xCE, "ADC A,#n"),
			new Opcode(0xCF, "RST %s"),
			new Opcode(0xD0, "RET NC"),
			new Opcode(0xD1, "POP DE"),
			new Opcode(0xD2, "JP NC,#nn"),
			new Opcode(0xD3, "OUT (#n),A"),
			new Opcode(0xD4, "CALL NC,#nn"),
			new Opcode(0xD5, "PUSH DE"),
			new Opcode(0xD6, "SUB #n"),
			new Opcode(0xD7, "RST %s"),
			new Opcode(0xD8, "RET C"),
			new Opcode(0xD9, "EXX"),
			new Opcode(0xDA, "JP C,#nn"),
			new Opcode(0xDB, "IN A,(#n)"),
			new Opcode(0xDC, "CALL C,#nn"),
			new OpcodeExtended(0xDD, Opcode.OpcodesDD),
			new Opcode(0xDE, "SBC A,#n"),
			new Opcode(0xDF, "RST %s"),
			new Opcode(0xE0, "RET PO"),
			new Opcode(0xE1, "POP HL"),
			new Opcode(0xE2, "JP PO,#nn"),
			new Opcode(0xE3, "EX (SP),HL"),
			new Opcode(0xE4, "CALL PO,#nn"),
			new Opcode(0xE5, "PUSH HL"),
			new Opcode(0xE6, "AND #n"),
			new Opcode(0xE7, "RST %s"),
			new Opcode(0xE8, "RET PE"),
			new Opcode(0xE9, "JP (HL)"),
			new Opcode(0xEA, "JP PE,#nn"),
			new Opcode(0xEB, "EX DE,HL"),
			new Opcode(0xEC, "CALL PE,#nn"),
			new OpcodeExtended(0xED, Opcode.OpcodesED),
			new Opcode(0xEE, "XOR #n"),
			new Opcode(0xEF, "RST %s"),
			new Opcode(0xF0, "RET P"),
			new Opcode(0xF1, "POP AF"),
			new Opcode(0xF2, "JP P,#nn"),
			new Opcode(0xF3, "DI"),
			new Opcode(0xF4, "CALL P,#nn"),
			new Opcode(0xF5, "PUSH AF"),
			new Opcode(0xF6, "OR #n"),
			new Opcode(0xF7, "RST %s"),
			new Opcode(0xF8, "RET M"),
			new Opcode(0xF9, "LD SP,HL"),
			new Opcode(0xFA, "JP M,#nn"),
			new Opcode(0xFB, "EI"),
			new Opcode(0xFC, "CALL M,#nn"),
			new OpcodeExtended(0xFD, Opcode.OpcodesFD),
			new Opcode(0xFE, "CP #n"),
			new Opcode(0xFF, "RST %s")
		];
	}


	/**
	 * Constructor.
	 * @param code The opcode number equivalent.
	 * @param name The mnemonic.
	 */
	constructor(code?: number, name = '') {
		if (code == undefined)
			return;	// Ignore the rest because values wil be copied anyway.
		name = name.trim();
		this.code = code;
		this.flags = OpcodeFlag.NONE;
		this.valueType = NumberType.NONE;
		this.value = 0;
		this.length = 1;	// default
		// Retrieve valueType and opcode flags from name
		let k;
		if ((k = name.indexOf('#n')) > 0) {
			if (name.substring(k + 2, k + 3) == 'n') { // i.e. '#nn'
				// Word
				this.length = 3;
				// substitute formatting
				name = name.substring(0, k) + '%s' + name.substring(k + 3);
				// store type
				const indirect = name.substring(k - 1, k);
				if (indirect == '(') {
					// Enclosed in brackets ? E.g. "(20fe)" -> indirect (this is no call or jp)
					this.valueType = NumberType.DATA_LBL;
				}
				else {
					// now check for opcode flags
					if (name.startsWith("CALL")) {
						this.flags |= OpcodeFlag.CALL | OpcodeFlag.BRANCH_ADDRESS;
						this.valueType = NumberType.CODE_SUB;
						// Check if conditional
						if (name.indexOf(',') >= 0)
							this.flags |= OpcodeFlag.CONDITIONAL;
					}
					else if (name.startsWith("JP")) {
						this.flags |= OpcodeFlag.BRANCH_ADDRESS;
						this.valueType = NumberType.CODE_LBL;
						// Now check if it is conditional, i.e. if there is a ',' in the opcode
						// Check if conditional or stop code
						this.flags |= (name.indexOf(',') >= 0) ? OpcodeFlag.CONDITIONAL : OpcodeFlag.STOP;
					}
					else if (name.startsWith("LD SP,")) {
						// The stack pointer is loaded, so this is the top of the stack.
						this.valueType = NumberType.DATA_LBL;
					}
					else {
						// Either call nor jp
						this.valueType = NumberType.NUMBER_WORD;
					}
				}
			}
			else {
				// Byte
				this.length = 2;
				// substitute formatting
				name = name.substring(0, k) + '%s' + name.substring(k + 2);
				// store type
				this.valueType = NumberType.NUMBER_BYTE;

				// now check for opcode flags
				if (name.startsWith("DJNZ")) {
					this.valueType = NumberType.CODE_LOCAL_LBL;	// Becomes a loop because it jumps backwards.
					this.flags |= OpcodeFlag.BRANCH_ADDRESS | OpcodeFlag.CONDITIONAL;
				}
				if (name.startsWith("JR")) {
					this.valueType = NumberType.CODE_LOCAL_LBL;
					this.flags |= OpcodeFlag.BRANCH_ADDRESS;
					// Check if conditional or stop code
					this.flags |= (name.indexOf(',') >= 0) ? OpcodeFlag.CONDITIONAL : OpcodeFlag.STOP;
				}
				else if (name.startsWith("IN") || name.startsWith("OUT")) {
					// a port
					this.valueType = NumberType.PORT_LBL;
				}
			}
		}
		else if (name.startsWith("RET")) {	// "RETN", "RETI", "RET" with or without condition
			this.flags |= OpcodeFlag.RET;
			// Check if conditional or stop code
			this.flags |= (name.indexOf(' ') >= 0) ? OpcodeFlag.CONDITIONAL : OpcodeFlag.STOP;
		}
		else if (name.startsWith("RST")) {	// "RST"
			// Use like a CALL
			this.valueType = NumberType.CODE_RST;
			this.flags |= OpcodeFlag.BRANCH_ADDRESS | OpcodeFlag.CALL;

			// Get jump value
			const jumpAddress = this.code & 0b00111000;
			this.value = jumpAddress;
		}
		else if (name.startsWith("JP")) {	// "JP (HL)", "JP (IXY)" or "JP (C)"
			// Note: we don't set a branch address because we don't know where it jumps to: this.flags |= OpcodeFlag.BRANCH_ADDRESS;
			// But it is a stop code.
			this.flags |= OpcodeFlag.STOP;
		}

		// Store
		this.name = name;
	}


	/** toString: For debugging.
	 * Prints the address and the disassembledText.
	 * If not available the normal text.
	 * @returns E.g. "40A0 LD A,6"
	 */
	public toString() {
		// Address
		let text = '';
		if (this.addr64k)
			text += Format.getHexFormattedString(this.addr64k);
		else
			text += '????';
		text += ' ';

		// Dissasembly
		if (this.disassembledText)
			text += this.disassembledText;
		else
			text += this.name;

		return text;
	}


	/**
	 * Creates a copy object.
	 * If no deep copy is required then there is no need to override this.
	 * @returns A new object with same values.
	 */
	public clone(): Opcode {
		// Create empty object
		const clone: Opcode = Object.assign(Object.create(
			Object.getPrototypeOf(this),
			Object.getOwnPropertyDescriptors(this)
		));
		return clone;
	}


	/**
	 * Returns the Opcode at address.
	 * @param address The address to retrieve.
	 * @returns It's opcode.
	 */
	public static getOpcodeAt(memory: BaseMemory, address: number, opcodes = Opcode.Opcodes): Opcode {
		const memValue = memory.getValueAt(address);
		const opcode = opcodes[memValue];
		const realOpcode = opcode.getOpcodeAt(memory, address);
		return realOpcode;
	}


	/**
	 * The 1 byte opcodes just return self (this).
	 * @param memory The memory area to get the opcode from.
	 * @param address The address of the opcode.
	 * @returns this
	 */
	public getOpcodeAt(memory: BaseMemory, address: number): Opcode {
		// Get value (if any)
		switch (this.valueType) {
			case NumberType.CODE_RST:
			case NumberType.NONE:
				// no value
				break;
			case NumberType.CODE_LBL:
			case NumberType.CODE_SUB:
			case NumberType.CODE_SUB:
			case NumberType.DATA_LBL:
			case NumberType.NUMBER_WORD:
				// word value
				this.value = memory.getWordValueAt(address + 1);
				break;
			case NumberType.NUMBER_WORD_BIG_ENDIAN:
				// e.g. for PUSH $nnnn
				this.value = memory.getBigEndianWordValueAt(address + 1);
				break;
			case NumberType.RELATIVE_INDEX:
			case NumberType.CODE_LOCAL_LBL:
			case NumberType.CODE_LOCAL_LOOP:
				// byte value
				this.value = memory.getValueAt(address + 1);
				if (this.value >= 0x80)
					this.value -= 0x100;
				// Change relative jump address to absolute
				if (this.valueType == NumberType.CODE_LOCAL_LBL || this.valueType == NumberType.CODE_LOCAL_LOOP)
					this.value += address + 2;
				break;
			case NumberType.NUMBER_BYTE:
				// byte value
				this.value = memory.getValueAt(address + 1);
				break;
			case NumberType.PORT_LBL:
				// NOTE: should be implemented differently
				this.value = memory.getValueAt(address + 1);
				break;
			default:
				assert(false, 'getOpcodeAt');
				break;
		}

		return this;
	}


	/** Disassembles one opcode together with a referenced label (if there
	 * is one).
	 * At the end the this.disassembledText is updated accordingly.
	 * E.g. "LD A,(DATA_LBL1)" or "JR Z,.sub1_lbl3".
	 * @param func A function that returns a label for a (64k) address.
	 */
	public disassembleOpcode(funcGetLabel: (addr64k: number) => string, upperCase = false) {
		// Check if there is any value
		if (this.valueType == NumberType.NONE) {
			// Just e.g. "INC A"
			this.disassembledText = this.name;
			return;
		}

		// Get referenced label name
		let valueName:  string;
		if (this.valueType == NumberType.CODE_LBL
			|| this.valueType == NumberType.CODE_LOCAL_LBL
			|| this.valueType == NumberType.CODE_LOCAL_LOOP
			|| this.valueType == NumberType.CODE_SUB
			|| this.valueType == NumberType.CODE_RST
			|| this.valueType == NumberType.DATA_LBL) {
			valueName = funcGetLabel(this.value);
		}
		else if (this.valueType == NumberType.RELATIVE_INDEX) {
			// E.g. in 'LD (IX+n),A'
			let val = this.value;
			valueName = (val >= 0) ? '+' : '';
			valueName += val.toString();
		}
		else if (this.valueType == NumberType.NUMBER_BYTE) {
			// byte
			valueName = Format.getHexFormattedString(this.value, 2);
		}
		else {
			// Word, interpret as label
			if (this.value < 0x100)
				valueName = Format.getHexFormattedString(this.value, 4);
			else
				valueName = funcGetLabel(this.value);
		}

		// Normal disassembly
		this.disassembledText = util.format(this.name, valueName);
	}
}


/// Opcode with a number index.
/// E.g. 0xDD 0x74 0x03 = ld (ix+3),h
class OpcodeIndex extends Opcode {
	/**
	 * Constructor.
	 * Set type to relative index.
	 * @param code The opcode number equivalent.
	 * @param name The mnemonic.
	 */
	constructor(code?: number, name = '') {
		super(code, name);
		this.valueType = NumberType.RELATIVE_INDEX;
		this.length++;
	}
}


/// Opcode that has a number index before the opcode (DDCB).
/// E.g. 0xDD 0xCB 0x03 0x01 = ld (ix+3),c
class OpcodePrevIndex extends OpcodeIndex {
	/**
	 * Constructor.
	 * Set type to relative index.
	 * @param code The opcode number equivalent.
	 * @param name The mnemonic.
	 */
	constructor(code?: number, name = '') {
		super(code, name);
		this.length++;
	}

	/**
	 * Gets the value from the byte which is PREVIOUS to the opcode.
	 * @param memory
	 * @param address
	 * @returns this
	 */
	public getOpcodeAt(memory: BaseMemory, address: number): Opcode {
		this.value = memory.getValueAt(address - 1);
		if (this.value >= 0x80)
			this.value -= 0x100;
		return this;
	}
}


/// Opcode that has a number index and an immediate value.
/// E.g. 0xDD 0x36 0x03 0x08 = ld (ix+3),8
class OpcodeIndexImmediate extends Opcode {
	// The second value (the immediate value, i.e. 8 in the example above.
	protected secondValue: number;


	/**
	 * Constructor.
	 */
	constructor(code?: number, name = '') {
		super(code, name);
		this.length = 3;	// Is afterwards corrected to 4
		this.valueType = NumberType.RELATIVE_INDEX;
	}


	/**
	 * Gets the value from the byte which is PREVIOUS to the opcode.
	 * @param memory
	 * @param address
	 * @returns this
	 */
	public getOpcodeAt(memory: BaseMemory, address: number): Opcode {
		this.value = memory.getValueAt(address + 1);
		if (this.value >= 0x80)
			this.value -= 0x100;
		this.secondValue = memory.getValueAt(address + 2);
		return this;
	}


	/** Disassembles one opcode together with a referenced label (if there
	 * is one).
	 * At the end the this.disassembledText is updated accordingly.
	 * E.g. "LD A,(DATA_LBL1)" or "JR Z,.sub1_lbl3".
	 * @param func A function that returns a label for a (64k) address.
	 */
	public disassembleOpcode(funcGetLabel: (addr64k: number) => string) {
		super.disassembleOpcode(funcGetLabel);
		// Results e.g. in "LD (IX+6),%s"

		const valueName = Format.getHexFormattedString(this.secondValue, 2);
		this.disassembledText = util.format(this.disassembledText, valueName);
	}
}


class OpcodeExtended extends Opcode {
	/// Array that holds the sub opcodes for this opcode.
	public opcodes: Opcode[];

	/**
	 * On construction the array is passed which holds the opcodes for this extended opcode.
	 * @param code The code, e.g. 0xCD or 0xDD
	 * @param opcodes The array with opcodes.
	 */
	constructor(code: number, opcodes: Opcode[]) {
		super(code);
		this.opcodes = opcodes;
		this.length += 1;	// one more
	}


	/**
	 * The extended opcodes must return the next byte.
	 * @param memory Unused
	 * @param address Unused
	 * @returns The opcode from the address after the current one.
	 */
	public getOpcodeAt(memory: BaseMemory, address: number): Opcode {
		return Opcode.getOpcodeAt(memory, address + 1, this.opcodes);
	}
}


/// 3 (4) byte opcode
class OpcodeExtended2 extends OpcodeExtended {

	/// Pass also the opcode array.
	constructor(code: number, opcodes: Array<Opcode>) {
		super(code, opcodes);
		this.length += 1;	// one more
	}

	/**
	 * This is a 3 byte opcode.
	 * The first 2 bytes are DDCB followed by a value (for the index),
	 * followed by the rest of the opcode.
	 */
	public getOpcodeAt(memory: BaseMemory, address: number): Opcode {
		return Opcode.getOpcodeAt(memory, address + 2, this.opcodes);
	}
}




/// Special opcode that works as a NOP.
/// E.g. 2 0xDD after each other: Then the first 0xDD is like a nop.
class OpcodeNOP extends Opcode {
	constructor(code: number) {
		super(code, '');
		this.name = '[NOP]\t; because of following 0x' + Format.getHexString(code, 2);
		this.length--;	// Does not anything to the length (but is afterwards increased)
	}
}


/// Special opcode for an invalid instruction.
/// E.g. 2 0xDD after each other: Then the first 0xDD is like a nop.
class OpcodeInvalid extends Opcode {
	constructor(code: number) {
		super(code, '');
		this.name = 'INVALID INSTRUCTION\t; mostly equivalent to NOP.';
	}
}


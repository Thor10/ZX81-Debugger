/**
 * ZX81 Debugger
 * 
 * File:			numbertype.ts
 * Description:		Different kind of numbers
 * Author:			Sebastien Andrivet, based on Dezog my Thomas Busse (Maziac)
 * License:			GPLv3
 * Copyrights: 		ZX81 Debugger Copyright (C) 2023 Sebastien Andrivet
 * 					DeZog Copyright (C) 2023 Maziac
 */
import {strict as assert} from 'assert';


/// A categorization (and prioritization) of the numbers (labels) in the opcodes.
/// The higher the number, the higher the priority.
export const enum NumberType {
	// No label
	NONE = 0,

	// "Data LBL"-type, low priority, might be changed to SUB if necessary.
	DATA_LBL = 1,
	// Label for "out/in" command
	PORT_LBL = 2,	// REMARK: Port needs other handling. Is another space, i.e. a memory label and a port label could have same number.

	// "relative-label"-type, i.e. JR
	CODE_LOCAL_LBL = 3,
	// "loop"-type
	CODE_LOCAL_LOOP = 4,
	// "LBL"-type
	CODE_LBL = 5,
	// "SUB"-type
	CODE_SUB = 6,
	// "RST"-type
	CODE_RST = 7,
	// A relative index like (IX+5) or (IY-3)
	RELATIVE_INDEX = 8,
	// "BYTE"-type
	NUMBER_BYTE = 9,
	// "WORD"-type
	NUMBER_WORD = 10,
	// "WORD"-type for ZX Next command "PUSH $nnnn"
	NUMBER_WORD_BIG_ENDIAN = 11,
}



/**
 * returns the LabelType enum as string.
 * For debugging.
 */
export function getNumberTypeAsString(type: NumberType): string {
	switch (type) {
		case NumberType.NONE: return "NONE";
		case NumberType.CODE_LOCAL_LBL: return "CODE_RELATIVE_LBL";
		case NumberType.CODE_LOCAL_LOOP: return "CODE_RELATIVE_LOOP";
		case NumberType.CODE_LBL: return "CODE_LBL";
		case NumberType.CODE_SUB: return "CODE_SUB";
		case NumberType.CODE_RST: return "CODE_RST";
		case NumberType.RELATIVE_INDEX: return "RELATIVE_INDEX";
		case NumberType.NUMBER_BYTE: return "NUMBER_BYTE";
		case NumberType.NUMBER_WORD: return "NUMBER_WORD";
		case NumberType.NUMBER_WORD_BIG_ENDIAN: return "NUMBER_WORD_BIG_ENDIAN";
		case NumberType.DATA_LBL: return "DATA_LBL";
		//case NumberType.SELF_MODIFYING_CODE:	return "SELF_MODIFYING_CODE";
		case NumberType.PORT_LBL: return "PORT_LBL";
	}
	// Unknown
	assert(false, 'getNumberTypeAsString');
	return "UNDEFINED";
}

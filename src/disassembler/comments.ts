/**
 * ZX81 Debugger
 * 
 * File:			comments.ts
 * Description:		Stores comments that are created during disassembly.
 * Author:			Sebastien Andrivet, based on Dezog my Thomas Busse (Maziac)
 * License:			GPLv3
 * Copyrights: 		ZX81 Debugger Copyright (C) 2023 Sebastien Andrivet
 * 					DeZog Copyright (C) 2023 Maziac
 */
import {Format} from "./core/format";


/** Class that stores comments that are created during disassembly.
 * E.g. comment about ambiguity of a disassembly.
 */
export class Comments {
	// Stores the comments for a line (a line may have several comments in theory
	// although, most of the time, it has only one)
	protected addrComments = new Map<number, string[]>();


	/** Clears all comments.
	*/
	public clear() {
		this.addrComments.clear();
	}


	/** Adds a comment to an address.
	 * @param addr64k The address.
	 * @param comment The comment.
	 */
	public addCommentForAddress(addr64k: number, comment: string) {
		let lines = this.addrComments.get(addr64k);
		if (!lines) {
			// Create array
			lines = [];
			this.addrComments.set(addr64k, lines);
		}
		// Add comment
		lines.push(comment);
	}


	/** Returns the comments in an address range.
	 * @param addr64k The address.
	 * @param len The range of addresses to check. [addr64k, addr64k+len-1]
	 * @returns A string array with comments or an empty array.
	 */
	public getCommentsForAddresses(addr64k: number, len: number): string[] {
		const comments: string[] = [];
		const addrEnd = addr64k + len;
		for (let addr = addr64k; addr < addrEnd; addr++) {
			const lines = this.addrComments.get(addr);
			if (lines) {
				// Process each comment (calls the given function on each comment)
				comments.push(...lines);
			}
		}
		return comments;
	}


	/** Adds comment that disassembly is ambiguous.
	 * @param originAddress The originating address. E.g. the previous address or the address
	 * of the JP or CALL instruction or even the same address.
	 * @param targetAddress The address in the other bank
	 */
	public addAmbiguousComment(originAddress: number, targetAddress: number) {
		this.addCommentForAddress(originAddress, 'The disassembly is ambiguous at ' + Format.getHexFormattedString(targetAddress, 4) + '.');
	}


	/** Adds comment that disassembly tries to access a different bank.
	 * As the contents of that bank is not known the program flow is not followed.
	 * @param originAddress The originating address. E.g. the previous address or the address
	 * of the JP or CALL instruction.
	 * @param targetAddress The address in the other bank
	 */
	public addDifferentBankAccessComment(originAddress: number, targetAddress: number) {
		this.addCommentForAddress(originAddress, 'The address ' + Format.getHexFormattedString(targetAddress, 4) + ' is in a different bank.');
	}


	/** Adds comment that disassembly did a branch to unassigned memory.
	 * @param originAddress The originating address. E.g. the previous address or the address
	 * of the JP or CALL instruction.
	 * @param targetAddress The address in the other bank
	 */
	public addBranchToUnassignedMemory(originAddress: number, targetAddress: number) {
		this.addCommentForAddress(originAddress, 'The disassembly branches into unassigned memory at ' + Format.getHexFormattedString(targetAddress, 4) + '.');
	}
}

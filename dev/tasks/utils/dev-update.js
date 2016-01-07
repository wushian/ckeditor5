/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const tools = require( './tools' );
const git = require( './git' );
const path = require( 'path' );

/**
 * 1. Get CKEditor5 dependencies from package.json file.
 * 2. Scan workspace for repositories that match dependencies from package.json file.
 * 3. Run GIT pull command on each repository found.
 *
 * @param {String} ckeditor5Path Path to main CKEditor5 repository.
 * @param {Object} packageJSON Parsed package.json file from CKEditor5 repository.
 * @param {String} workspaceRoot Relative path to workspace root.
 * @param {Function} writeln Function for log output.
 * @param {Boolean} runNpmUpdate When set to true `npm update` will be executed inside each plugin repository
 * and inside CKEditor 5 repository.
 */
module.exports = ( ckeditor5Path, packageJSON, workspaceRoot, writeln, runNpmUpdate ) => {
	const workspaceAbsolutePath = path.join( ckeditor5Path, workspaceRoot );

	// Get all CKEditor dependencies from package.json.
	const dependencies = tools.getCKEditorDependencies( packageJSON.dependencies );

	if ( dependencies ) {
		const directories = tools.getCKE5Directories( workspaceAbsolutePath );

		if ( directories.length ) {
			for ( let dependency in dependencies ) {
				const repositoryURL = dependencies[ dependency ];
				const urlInfo = git.parseRepositoryUrl( repositoryURL );
				const repositoryAbsolutePath = path.join( workspaceAbsolutePath, dependency );

				// Check if repository's directory already exists.
				if ( directories.indexOf( urlInfo.name ) > -1 ) {
					writeln( `Checking out ${ urlInfo.name } to ${ urlInfo.branch }...` );
					git.checkout( repositoryAbsolutePath, urlInfo.branch );

					writeln( `Pulling changes to ${ urlInfo.name }...` );
					git.pull( repositoryAbsolutePath, urlInfo.branch );

					if ( runNpmUpdate ) {
						writeln( `Running "npm update" in ${ urlInfo.name }...` );
						tools.npmUpdate( repositoryAbsolutePath );
					}
				}
			}

			if ( runNpmUpdate ) {
				writeln( `Running "npm update" in CKEditor5 repository...` );
				tools.npmUpdate( ckeditor5Path );
			}
		} else {
			writeln( 'No CKEditor5 plugins in development mode.' );
		}
	} else {
		writeln( 'No CKEditor5 dependencies found in package.json file.' );
	}
};
import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

const sourceFiles = project.getSourceFiles();

sourceFiles.forEach((sourceFile) => {
  const classes = sourceFile.getClasses();

  classes.forEach((classDecl) => {
    const methods = classDecl.getMethods();

    methods.forEach((method) => {
      const references = method.findReferencesAsNodes();
      if (references.length <= 1) {
        // 1 because declaration counts as reference
        // eslint-disable-next-line no-console
        console.log(
          `Unused method found: ${method.getName()} in ${sourceFile.getFilePath()}:${method.getStartLineNumber()}`
        );
      }
    });
  });
});

/**
 * Configuration de l'interface GraphiQL
 */

export const GRAPHIQL_CONFIG = {
  title: "Adresse Explorer API",
  defaultQuery: `# Explore l'API !

query Departements {
  departements {
    code
    nom
    communeCount
  }
}

query Paris {
  departement(code: "75") {
    nom
    communes {
      nom
      codePostal
      voieCount
    }
  }
}

query Commune {
  commune(codeInsee: "75101") {
    nom
    codePostal
    departement {
      nom
    }
  }
}
`,
}

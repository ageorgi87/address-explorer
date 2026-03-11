export const departementTypeDefs = /* GraphQL */ `
  type Query {
    "Liste de tous les départements"
    departements: [Departement!]!

    "Un département par son code"
    departement(code: String!): Departement
  }

  "Département français"
  type Departement {
    "Code du département (ex: 75)"
    code: String!

    "Nom officiel"
    nom: String!

    "Nom formaté (ex: 75 - Paris)"
    displayName: String!

    "Nombre de communes"
    communeCount: Int!

    "Liste des communes"
    communes: [Commune!]!
  }
`

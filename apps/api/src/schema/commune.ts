import { gql } from "graphql-tag";

export const communeTypeDefs = gql`
  extend type Query {
    "Une commune par son code INSEE"
    commune(codeInsee: String!): Commune

    "Liste des communes (filtrables)"
    communes(departementCode: String, codePostal: String): [Commune!]!

    "Recherche full-text de communes"
    searchCommunes(search: String!, first: Int = 10): [Commune!]!
  }

  "Commune française"
  type Commune {
    "Code INSEE (identifiant unique)"
    id: String!

    "Nom de la commune"
    nom: String!

    "Code postal principal"
    codePostal: String!

    "Département parent"
    departement: Departement!

    "Code du département"
    departementCode: String!

    "Nombre de voies"
    voieCount: Int!

    "Liste des voies (max 100)"
    voies: [Voie!]!
  }
`;

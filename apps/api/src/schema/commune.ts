import { gql } from "graphql-tag";

export const communeTypeDefs = gql`
  extend type Query {
    "Une commune par son code INSEE"
    commune(id: String!): Commune

    "Communes d'un département"
    communesByDepartement(departementCode: String!): [Commune!]!
  }

  "Commune française"
  type Commune {
    "Code INSEE (identifiant unique)"
    id: String!

    "Nom de la commune"
    nom: String!

    "Code postal principal"
    codePostal: String!

    "Nom formaté avec code postal"
    displayName: String!

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

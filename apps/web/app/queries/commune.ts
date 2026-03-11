import gql from "graphql-tag";

export interface CommuneData {
  commune: {
    id: string;
    nom: string;
    codePostal: string;
    departementCode: string;
    departement: {
      code: string;
      nom: string;
    };
    voieCount: number;
    voies: {
      id: string;
      nom: string;
      numeros: {
        id: string;
        numero: string;
        suffixe: string | null;
        lat: number;
        lon: number;
      }[];
    }[];
  } | null;
}

export const COMMUNE_QUERY = gql`
  query Commune($codeInsee: String!) {
    commune(codeInsee: $codeInsee) {
      id
      nom
      codePostal
      departementCode
      departement {
        code
        nom
      }
      voieCount
      voies {
        id
        nom
        numeros {
          id
          numero
          suffixe
          lat
          lon
        }
      }
    }
  }
`;

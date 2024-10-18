# AgendBot

## Descrição

Este é um chatbot para WhatsApp que utiliza a API da OpenAI para geração de texto, chamadas de função e transcrição de áudio. As mensagens enviadas através do ManyChat são direcionadas para um endpoint de API, que processa esses dados. O chatbot também inclui funcionalidades de agendamento utilizando a API do Google.

## Funcionalidades

- **Geração de texto:** Usa a API da OpenAI para gerar respostas e processar solicitações.
- **Transcrição de Áudio:** Capacidade de transcrever áudios enviados pelo usuário.
- **Funções agendadas:** Integração com a API do Google para agendamentos.
- **Integração com ManyChat:** Recebe mensagens do ManyChat e responde via API.

## Tecnologias Utilizadas

- **Node.js:** Ambiente de execução para JavaScript no servidor.
- **Express.js:** Framework minimalista para criar o servidor HTTP.
- **Axios:** Cliente HTTP para fazer requisições à API da OpenAI e outras APIs.
- **Mongoose:** ODM para MongoDB, facilitando a interação com o banco de dados.
- **Google APIs (googleapis):** Biblioteca para integração com serviços como Google Calendar.
- **Moment-timezone:** Manipulação de datas e fusos horários.
- **Prettier:** Ferramenta para formatação consistente do código.
- **OpenAI API:** Utilizada para gerar respostas automáticas e chamadas de função.
- **ManyChat:** Plataforma de automação de chatbot para integrar com o WhatsApp.
- **MongoDB:** Banco de dados NoSQL para armazenamento de dados.

## Pré-requisitos

Para rodar o projeto, você precisará ter instalado:

- [Node.js](https://nodejs.org/) (versão 20.x.x)
- [NPM](https://www.npmjs.com/)

Certifique-se de ter o `node` e `npm` instalados corretamente em sua máquina.

## Instalação
npm i

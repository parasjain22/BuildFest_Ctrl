**BharatVote – Trusting the Vote**



A secure digital voting system where voters stay anonymous, results stay transparent, and every vote is provably counted — without trusting any single authority.



---



**Project Overview**



BharatVote is a cryptography-based digital voting system designed to ensure:



\- Voter anonymity  

\- Public transparency  

\- Verifiable vote inclusion  

\- Duplicate vote prevention  

\- Tamper-evident election records  



The system separates identity verification from vote storage while maintaining public auditability.



---



**Problem Statement**



Traditional digital voting systems suffer from:



\- Centralized trust dependency  

\- Risk of vote tampering  

\- Limited transparency  

\- Identity exposure concerns  

\- Duplicate and ghost voting  



BharatVote addresses these challenges using hashing, nullifiers, encryption, and Merkle tree verification.



---



**Key Features**



\- Secure one-time registration  

\- OTP-based authentication  

\- Live identity verification  

\- Anonymous voting via secret key  

\- Nullifier-based duplicate prevention  

\- SHA-256 hashing  

\- Merkle tree integrity layer  

\- Blockchain-inspired append-only log  

\- Public audit dashboard  

\- Cryptographic vote receipt  



---



**Tech Stack**



\### Frontend

\- React  

\- HTML + CSS (Presentation Website)



\### Backend

\- Node.js  

\- Express.js  



\### Database

\- MongoDB Atlas  



\### Security

\- SHA-256 hashing  

\- Public-private key encryption  

\- Nullifier mechanism  

\- Merkle tree verification  



\### OTP Service

\- Fast2SMS (or Mock OTP for development)



---



**System Architecture**



Frontend → Backend → MongoDB Atlas  

\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;↓  

\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;Cryptographic Layer  

\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;↓  

\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;\&nbsp;Merkle Tree Integrity  



The system consists of:



1\. Identity Layer (Registration \& Authentication)  

2\. Anonymous Voting Layer  

3\. Integrity \& Audit Layer  



---



**Project Workflow**



1\. Registration  

2\. OTP Authentication  

3\. Face Verification  

4\. Anonymous Vote Casting  

5\. Merkle Proof Receipt Generation  

6\. Public Audit Verification  

7\. Secure Result Declaration  



---



**Security Mechanisms**



\- SHA-256 hashing of sensitive identity data  

\- Nullifier = hash(secret\_key + election\_id)  

\- Encrypted vote storage  

\- Merkle tree vote hashing  

\- Append-only tamper-evident logs  

\- Duplicate vote rejection  



---



**Folder Structure**



```bash

BharatVote/

│

├── frontend/

│   ├── src/

│   ├── components/

│   └── pages/

│

├── backend/

│   ├── models/

│   ├── routes/

│   ├── controllers/

│   ├── utils/

│   └── server.js

│

├── presentation-website/

│   └── finalpdl4website.html

│

└── README.md




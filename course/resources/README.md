# Books used by the course

The course cites four books. Every reading reference in a lesson links to the exact PDF page of the cited section. **The PDFs are not included in this repository.** They belong to their authors and publishers. Get your own copy as below and save it in this folder under the file name shown. The links then open at the right page when you run the course locally. Without a copy, a click on a reference tells you which book and page it points to.

The course contains original explanations and exercises; it does not reproduce book chapters.

| Key | Book | Where to get it | Save as |
|---|---|---|---|
| MML | *Mathematics for Machine Learning*, Marc Peter Deisenroth, A. Aldo Faisal and Cheng Soon Ong (Cambridge University Press, 2020) | Free PDF from the authors: [mml-book.github.io](https://mml-book.github.io/) (page numbers follow the draft dated 15 January 2024) | `mathematics-for-machine-learning.pdf` |
| CV | *Computer Vision: Algorithms and Applications*, 2nd edition, Richard Szeliski (Springer, 2022) | Free PDF for personal use from the author: [szeliski.org/Book](https://szeliski.org/Book/), or the printed book | `computer-vision-szeliski-2nd-edition.pdf` |
| CS205A | *Mathematical Methods for Computer Vision, Robotics, and Graphics*, Justin Solomon (Stanford CS205A course notes, 2013) | The notes grew into the book *Numerical Algorithms* (CRC Press, 2015); look for the course notes or the book through the author or your library | `cs205a-mathematical-methods.pdf` |
| GUO | *Modern Mathematics and Applications in Computer Graphics and Vision*, Hongyu Guo (World Scientific, 2014) | From the publisher or your library | `modern-mathematics-graphics-and-vision.pdf` |

Page links are built from the PDF bookmarks of the editions above. A different edition or printing may put sections on different pages. After adding your own copies you can rebuild the index with `python course/build_web_data.py` (requires `pypdf`).

## Free companions

- [Stanford CS231n](https://cs231n.stanford.edu/): applied deep-learning course for the later modules.
- [CS231n Python/NumPy tutorial](https://cs231n.github.io/python-numpy-tutorial/): the Python and NumPy sections suit the starter notebook.
- [CS231n neural-network case study](https://cs231n.github.io/neural-networks-case-study/): optional companion to Module 10.

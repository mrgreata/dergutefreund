/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */


const navSlide = () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');
    
    
    
    
    burger.addEventListener('click', () => {
        nav.classList.toggle('nav-active');
        document.body.classList.toggle('menu-open');
    
    navLinks.forEach((link, index) => {
        if (link.style.animation) {
            link.style.animation = '';
        } else {
            link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
        }
        console.log(index / 5 + 0.2);
    });
    //Burger Animation
    burger.classList.toggle('toggle');
    
  });
  }

navSlide();
 
 